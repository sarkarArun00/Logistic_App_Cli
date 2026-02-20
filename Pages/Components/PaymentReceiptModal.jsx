import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RazorpayWebView from "../Wallet/RazorpayWebView";

// ---------- helpers ----------
const parseAmount = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

const fdAppend = (fd, key, value) => {
  if (value === undefined || value === null) return;
  fd.append(key, typeof value === "string" ? value : String(value));
};

// ---------- Reusable Component ----------
export default function PaymentReceiptModal({
  visible,
  onClose,

  // data / fetchers
  clients = [],
  banks = [],
  denominations = [], // full API list [{id,type,denominationName}, ...]
  fetchClients,       // async () => void (optional)
  fetchBanks,         // async () => void (optional)
  fetchDenominations, // async () => void (optional)

  // optional preselected client
  initialClientId = "",

  // attachments
  onPickAttachment, // async () => file or array (optional)
  attachment,       // any (optional)
  onRemoveAttachment, // optional

  // gateway for upi/card
  onOpenGateway, // async ({amount, mode}) => { success:true, transaction_id } or throws

  // final submit
  onSubmit, // async (formData, ctx) => response

  // styles & helpers
  styles,
  toWords,      // function (number) => string
  formatDate,   // function (Date) => "YYYY-MM-DD"
  showAlert,    // function (msg, isError)
}) {
  // ---------- main states ----------
  const [selectClient, setSelectClient] = useState(initialClientId);
  const [selectPaymode, setSelectPaymode] = useState(""); // "1" "2" "3" "4"
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  // modal states
  const [detailsModalVisible, setDetailsModalVisible] = useState(false); // denomination/cheque modal
  const [isSubmitting, setIsSubmitting] = useState(false);

  // denomination selector states
  const [denoms, setDenoms] = useState({ note: [], coin: [] }); // values only
  const [tab, setTab] = useState("note");
  const [counts, setCounts] = useState({}); // { "note_200":2, "coin_5":3 }

  // cheque states
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState(null);
  const [selectBank, setSelectBank] = useState("");
  const [chequeDetails, setChequeDetails] = useState(null); // submitted cheque details

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

const showChequeDatePicker = () => setDatePickerVisibility(true);
const hideChequeDatePicker = () => setDatePickerVisibility(false);

const [gatewayVisible, setGatewayVisible] = useState(false);
const [gatewayMode, setGatewayMode] = useState(null); // "3" or "4"

const handleChequeDateConfirm = (date) => {
  setChequeDate(date);
  hideChequeDatePicker();
};

  // ---------- on open ----------
  useEffect(() => {
    if (!visible) return;

    // load required lists
    fetchClients?.();
    fetchBanks?.();
    fetchDenominations?.();
  }, [visible]);

  // ---------- build denom lists from master ----------
  useEffect(() => {
    if (!Array.isArray(denominations)) return;

    const notes = denominations
      .filter((x) => String(x.type).toLowerCase() === "note")
      .map((x) => Number(x.denominationName))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    const coins = denominations
      .filter((x) => String(x.type).toLowerCase() === "coin")
      .map((x) => Number(x.denominationName))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    setDenoms({ note: notes, coin: coins });
    if (!notes.length && coins.length) setTab("coin");
    else setTab("note");
  }, [denominations]);

  // ---------- derived ----------
  const enteredAmount = useMemo(() => parseAmount(amount), [amount]);

  const total = useMemo(() => {
    let sum = 0;
    for (const [key, qty] of Object.entries(counts)) {
      const [, denomStr] = key.split("_");
      sum += Number(denomStr) * Number(qty || 0);
    }
    return sum;
  }, [counts]);

  const breakup = useMemo(() => {
    return Object.entries(counts)
      .map(([key, qty]) => {
        const [type, denomStr] = key.split("_");
        const denom = Number(denomStr);
        const q = Number(qty || 0);
        return { type, denom, qty: q, lineAmount: denom * q };
      })
      .filter((x) => x.qty > 0)
      .sort((a, b) => b.denom - a.denom);
  }, [counts]);

  // ---------- denomination id resolver ----------
  const getDenominationId = useCallback(
    (type, value) => {
      const apiType = type === "note" ? "note" : "coin";
      const hit = denominations.find(
        (d) =>
          String(d.type).toLowerCase() === apiType &&
          Number(d.denominationName) === Number(value)
      );
      return hit?.id;
    },
    [denominations]
  );

  const updateCount = useCallback((type, value, delta) => {
    const key = `${type}_${value}`;
    setCounts((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  }, []);

  // ---------- mode change reset ----------
  useEffect(() => {
    // reset payment details when mode changes
    setCounts({});
    setChequeDetails(null);
    setChequeNo("");
    setChequeDate(null);
    setSelectBank("");
  }, [selectPaymode]);

  // ---------- open details modal after amount entered ----------
  const openDetailsModalIfNeeded = () => {
    if (!enteredAmount || enteredAmount <= 0) return;

    const mode = String(selectPaymode);
    if (mode === "1" || mode === "2") {
      setDetailsModalVisible(true);
    }
  };

  // ---------- submit details modal ----------
  const submitCashDetails = () => {
    if (!enteredAmount) return showAlert?.("Enter amount first.", true);
    if (total !== enteredAmount) {
      const diff = enteredAmount - total;
      return showAlert?.(
        diff > 0
          ? `Denomination total is short by ₹${diff}.`
          : `Denomination total exceeds by ₹${Math.abs(diff)}.`,
        true
      );
    }
    setDetailsModalVisible(false);
  };

  const submitChequeDetails = () => {
    if (!enteredAmount) return showAlert?.("Enter amount first.", true);
    if (!String(chequeNo || "").trim()) return showAlert?.("Cheque number is required.", true);
    if (!chequeDate) return showAlert?.("Cheque date is required.", true);
    if (!selectBank) return showAlert?.("Bank is required.", true);

    const bankObj = (banks || []).find((b) => String(b.id) === String(selectBank));
    setChequeDetails({
      chequeNo: String(chequeNo).trim(),
      chequeDate,
      bankId: selectBank,
      bankName: bankObj?.bank_name || "",
      amount: enteredAmount,
    });

    setDetailsModalVisible(false);
  };

  // ---------- build ctx + formdata ----------
  const buildCashDenominations = () => {
    const rows = [];
    for (const [key, qty] of Object.entries(counts)) {
      const [type, denomStr] = key.split("_");
      const faceValue = Number(denomStr);
      const count = Number(qty || 0);
      if (!count) continue;

      const denomination_id = getDenominationId(type, faceValue);
      if (!denomination_id) throw new Error(`Denomination id not found for ${type} ₹${faceValue}`);

      rows.push({ denomination_id, count, amount: faceValue });
    }
    return rows;
  };

  const buildPaymentContext = async (transaction_id = "") => {
    const client_id = Number(selectClient);
    const payment_mode_type_id = Number(selectPaymode);
    const received_amount = enteredAmount;

    if (!client_id) return { ok: false, error: "Client is required." };
    if (!payment_mode_type_id) return { ok: false, error: "Payment mode is required." };
    if (!received_amount) return { ok: false, error: "Amount is required." };

    const received_by = Number((await AsyncStorage.getItem("user_id")) || 0);
    if (!received_by) return { ok: false, error: "User not found. Please login again." };

    const payment_date = formatDate(new Date());

    const ctx = {
      ok: true,
      client_id,
      payment_mode_type_id,
      payment_date,
      received_amount,
      received_by,
      remarks: remarks || "",
      transection_id: transaction_id || "",
      invoices: [], // if you need invoices pass via props & merge here
    };

    // CASH
    if (payment_mode_type_id === 1) {
      if (total !== received_amount) return { ok: false, error: `Denomination total must match ₹${received_amount}.` };
      ctx.denominations = buildCashDenominations();
      if (!ctx.denominations.length) return { ok: false, error: "Please enter denominations." };
    }

    // CHEQUE
    if (payment_mode_type_id === 2) {
      if (!chequeDetails) return { ok: false, error: "Please submit cheque details." };
      ctx.bank = Number(chequeDetails.bankId);
      ctx.cheque_number = chequeDetails.chequeNo;
      ctx.cheque_date = formatDate(chequeDetails.chequeDate);
    }

    return ctx;
  };

  const buildPaymentFormData = (ctx) => {
    const fd = new FormData();

    fdAppend(fd, "client_id", ctx.client_id);
    fdAppend(fd, "payment_mode_type_id", ctx.payment_mode_type_id);
    fdAppend(fd, "payment_date", ctx.payment_date);
    fdAppend(fd, "received_amount", ctx.received_amount);
    fdAppend(fd, "received_by", ctx.received_by);
    fdAppend(fd, "remarks", ctx.remarks || "");
    fdAppend(fd, "transection_id", ctx.transection_id || "");

    (ctx.invoices || []).forEach((inv, i) => {
      fdAppend(fd, `invoices[${i}][invoice_id]`, inv.invoice_id);
      fdAppend(fd, `invoices[${i}][amount]`, inv.amount);
    });

    if (ctx.payment_mode_type_id === 1) {
      (ctx.denominations || []).forEach((d, i) => {
        fdAppend(fd, `denominations[${i}][denomination_id]`, d.denomination_id);
        fdAppend(fd, `denominations[${i}][count]`, d.count);
        fdAppend(fd, `denominations[${i}][amount]`, d.amount);
      });
    }

    if (ctx.payment_mode_type_id === 2) {
      fdAppend(fd, "bank", ctx.bank);
      fdAppend(fd, "cheque_number", ctx.cheque_number);
      fdAppend(fd, "cheque_date", ctx.cheque_date);
    }

    // attachment (optional): if you pick file, append here
    // fd.append("attachment", { uri, type, name });

    return fd;
  };

  // ---------- main action ----------
  const handleGenerateOrPay = async () => {
    const mode = String(selectPaymode);

    // open details modal if cash/cheque and not done
    if ((mode === "1" && total !== enteredAmount) || (mode === "2" && !chequeDetails)) {
      openDetailsModalIfNeeded();
      return;
    }

    try {
      setIsSubmitting(true);

      // UPI/Card -> gateway first
      let transaction_id = "";
      if (mode === "3" || mode === "4") {
        setGatewayMode(mode);
        setGatewayVisible(true);
        return;
      }

      if (mode === "3" || mode === "4") {
        if (!onOpenGateway) {
          showAlert?.("Payment gateway not configured.", true);
          setIsSubmitting(false);
          return;
        }
        const gw = await onOpenGateway({ amount: enteredAmount, mode });
        if (!gw?.success || !gw?.transaction_id) {
          showAlert?.("Payment failed/cancelled.", true);
          setIsSubmitting(false);
          return;
        }
        transaction_id = gw.transaction_id;
      }

      const ctx = await buildPaymentContext(transaction_id);
      if (!ctx.ok) {
        showAlert?.(ctx.error || "Invalid data", true);
        setIsSubmitting(false);
        return;
      }

      const fd = buildPaymentFormData(ctx);

      // debug
      console.log("CTX:", ctx);
      if (fd?._parts?.length) fd._parts.forEach(([k, v]) => console.log(k, v));

      const res = await onSubmit?.(fd, ctx);
      // you can standardize res.status === 1
      if (res?.status === 1) {
        showAlert?.("Submitted Successfully!", false);

        // reset
        setSelectClient(initialClientId || "");
        setSelectPaymode("");
        setAmount("");
        setRemarks("");
        setCounts({});
        setChequeDetails(null);
        setChequeNo("");
        setChequeDate(null);
        setSelectBank("");
        onClose?.();
      } else {
        showAlert?.(res?.message || "Something went wrong", true);
      }
    } catch (e) {
      console.log("handleGenerateOrPay error:", e);
      showAlert?.("Something went wrong", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAfterGateway = async (transaction_id) => {
    try {
      setIsSubmitting(true);
    
      const ctx = await buildPaymentContext(transaction_id);
      console.log('87788787888887', ctx)
      if (!ctx.ok) return showAlert?.(ctx.error, true);
  
      const fd = buildPaymentFormData(ctx);
  
      const res = await onSubmit?.(fd, ctx);
      if (res?.status === 1) {
        showAlert?.("Submitted Successfully!", false);
        onClose?.();
      } else {
        showAlert?.(res?.message || "Something went wrong", true);
      }
    } catch (e) {
      console.log("Gateway submit error:", e);
      showAlert?.("Something went wrong", true);
    } finally {
      setIsSubmitting(false);
    }
  };
  // ---------- UI ----------
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#ECEDF0" }}>
              <Text style={styles.modalText}>Create Receipt:</Text>
              <TouchableOpacity onPress={onClose}>
                <Image style={{ width: 18, height: 18 }} source={require("../../assets/mdlclose.png")} />
              </TouchableOpacity>
            </View>

            {/* Client */}
            <Text style={styles.label}>Client Name</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectClient} onValueChange={setSelectClient} style={styles.picker}>
                <Picker.Item label="Select Client" value="" />
                {clients.map((c) => (
                  <Picker.Item key={c.id} label={c.client_name} value={c.id} />
                ))}
              </Picker>
            </View>

            {/* Mode */}
            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectPaymode} onValueChange={setSelectPaymode} style={styles.picker}>
                <Picker.Item label="Select Payment Mode" value="" />
                <Picker.Item value="1" label="Cash" />
                <Picker.Item value="2" label="Cheque" />
                <Picker.Item value="3" label="UPI" />
                <Picker.Item value="4" label="Debit/Credit Card" />
              </Picker>
            </View>

            {/* Amount */}
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              onEndEditing={openDetailsModalIfNeeded}
            />

            {/* Payment Details */}
            {(String(selectPaymode) === "1" || String(selectPaymode) === "2") && (
            <View style={styles.payDtl}>
              <Text style={styles.payDtlText}>Payment Details</Text>

              {/* Cash summary */}
              {String(selectPaymode) === "1" && (
                <>
                  <View style={styles.denoBoxMain}>
                    <Text style={[styles.denoLabel, { flex: 2 }]}>Denomination</Text>
                    <Text style={[styles.denoLabel, { flex: 1 }, styles.centerColumn]}>Qty.</Text>
                    <Text style={[styles.denoLabel, { flex: 1 }, styles.rightColumn]}>Amount</Text>
                  </View>

                  {breakup.length === 0 ? (
                    <Text style={{ paddingVertical: 12, color: "#777" }}>No denominations selected.</Text>
                  ) : (
                    breakup.map((row) => (
                      <View key={`${row.type}_${row.denom}`} style={styles.denoBoxInn}>
                        <View style={[styles.denoValue2, { flex: 2 }]}>
                          <Image style={{ width: 30, height: 17, resizeMode: "contain" }} source={require("../../assets/money.png")} />
                          <Text>₹{row.denom}</Text>
                        </View>
                        <Text style={[styles.denoValue, { flex: 1 }, styles.centerColumn]}>{row.qty}</Text>
                        <Text style={[styles.denoValue, { flex: 1 }, styles.rightColumn]}>₹{row.lineAmount}</Text>
                      </View>
                    ))
                  )}

                  <View style={styles.sumTotal}>
                    <Text style={styles.sumTotalLabel}>Sum Total</Text>
                    <Text style={styles.sumTotaValue}>₹ {total.toFixed(2)}</Text>
                  </View>

                  <View style={styles.amtWords}>
                    <Text style={styles.amountInWdLabel}>Amount in Words</Text>
                    <Text style={styles.amountInWdValue}>
                      {enteredAmount ? `${toWords(enteredAmount)} Only` : "-"}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => setDetailsModalVisible(true)} style={{ marginTop: 10 }}>
                    <Text style={{ color: "#2F81F5" }}>Edit Denominations</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Cheque summary */}
              {String(selectPaymode) === "2" && (
                <>
                  {!chequeDetails ? (
                    <Text style={{ paddingVertical: 12, color: "#777" }}>Cheque details not submitted.</Text>
                  ) : (
                    <>
                      <View style={styles.isCheckBox}>
                        <Text style={styles.isCheckBoxLabel}>Cheque No.</Text>
                        <Text style={styles.isCheckBoxValue}>{chequeDetails.chequeNo}</Text>
                      </View>

                      <View style={styles.isCheckBox}>
                        <Text style={styles.isCheckBoxLabel}>Cheque Date</Text>
                        <Text style={styles.isCheckBoxValue}>{formatDate(chequeDetails.chequeDate)}</Text>
                      </View>

                      <View style={styles.isCheckBox}>
                        <Text style={styles.isCheckBoxLabel}>Bank Name</Text>
                        <Text style={styles.isCheckBoxValue}>{chequeDetails.bankName || "-"}</Text>
                      </View>

                      <View style={styles.isCheckBox}>
                        <Text style={styles.isCheckBoxLabel}>Amount</Text>
                        <Text style={styles.isCheckBoxValue}>₹{chequeDetails.amount}</Text>
                      </View>

                      <View style={styles.isCheckBox}>
                        <Text style={styles.isCheckBoxLabel}>Amount In Words</Text>
                        <Text style={styles.isCheckBoxValue}>{toWords(Number(chequeDetails.amount))} Only</Text>
                      </View>
                    </>
                  )}

                  <TouchableOpacity onPress={() => setDetailsModalVisible(true)} style={{ marginTop: 10 }}>
                    <Text style={{ color: "#2F81F5" }}>Edit Cheque Details</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            )}

            {/* Attachment */}
            <Text style={styles.label}>Attachment</Text>
            <TouchableOpacity style={styles.uploadContainer} onPress={onPickAttachment}>
              <Image style={{ width: 30, height: 28 }} source={require("../../assets/upload-icon.png")} />
              <Text style={styles.uploadTitle}>Upload</Text>
              <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
            </TouchableOpacity>

            {/* Remarks */}
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={styles.input}
              placeholder="Remarks"
              value={remarks}
              onChangeText={setRemarks}
            />

            {/* Action */}
            <TouchableOpacity
              onPress={handleGenerateOrPay}
              style={{ backgroundColor: "#2F81F5", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ fontSize: 16, color: "white", textAlign: "center", fontFamily: "Montserrat-SemiBold" }}>
                  {String(selectPaymode) === "3" || String(selectPaymode) === "4" ? "Pay & Submit" : "Generate"}
                </Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Details Modal (Cash Denomination / Cheque Form) */}
        <Modal animationType="slide" transparent visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#ECEDF0" }}>
                <Text style={styles.modalText}>
                  {String(selectPaymode) === "1" ? "Enter Denominations:" : "Enter Cheque Details:"}
                </Text>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                  <Image style={{ width: 18, height: 18 }} source={require("../../assets/mdlclose.png")} />
                </TouchableOpacity>
              </View>

              {/* CASH */}
              {String(selectPaymode) === "1" && (
                <>
                  <View style={styles.toggleWrap}>
                    {["note", "coin"].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}>
                        <Text style={tab === t && styles.toggleBtnActiveText}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <ScrollView>
                    {(denoms[tab] || []).map((val) => {
                      const key = `${tab}_${val}`;
                      const qty = counts[key] ?? 0;

                      return (
                        <View key={key} style={styles.DenoRows}>
                          <Text style={styles.amount}>₹{val}</Text>

                          <View style={styles.counter}>
                            <TouchableOpacity onPress={() => updateCount(tab, val, -1)} style={styles.counterBtn} disabled={qty === 0}>
                              <Text>-</Text>
                            </TouchableOpacity>

                            <Text style={styles.countText}>{qty}</Text>

                            <TouchableOpacity onPress={() => updateCount(tab, val, 1)} style={styles.counterBtn}>
                              <Text>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalText}>Total Amount:</Text>
                    <Text style={styles.totalText}>₹{total}</Text>
                  </View>

                  <TouchableOpacity onPress={submitCashDetails} style={{ backgroundColor: "#2F81F5", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10 }}>
                    <Text style={{ fontFamily: "Montserrat-SemiBold", fontSize: 16, color: "white", textAlign: "center" }}>Submit</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* CHEQUE */}
              {String(selectPaymode) === "2" && (
                <>
                  <Text style={styles.label}>Cheque No.</Text>
                  <TextInput style={styles.input} placeholder="Enter Cheque No." value={chequeNo} onChangeText={setChequeNo} />

                  {/* Keep your date picker implementation outside & pass handlers if needed */}
                  <Text style={styles.label}>Cheque Date</Text>

                    <TouchableOpacity
                    style={styles.dateContainer ?? styles.input}   // use your dateContainer if exists
                    onPress={showChequeDatePicker}
                    >
                    <Text style={{ color: chequeDate ? "#000" : "#0C0D36", fontFamily: "Montserrat-Medium", fontSize: 15 }}>
                        {chequeDate ? formatDate(chequeDate) : "Select Cheque Date"}
                    </Text>
                    </TouchableOpacity>

                    <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleChequeDateConfirm}
                    onCancel={hideChequeDatePicker}
                    />

                  <Text style={styles.label}>Bank Name</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={selectBank} onValueChange={setSelectBank} style={styles.picker}>
                      <Picker.Item label="Select bank" value="" />
                      {banks.map((b) => (
                        <Picker.Item key={b.id} label={b.bank_name} value={b.id} />
                      ))}
                    </Picker>
                  </View>

                  <Text style={styles.label}>Amount</Text>
                  <TextInput style={[styles.input, { backgroundColor: "#F3F4F6" }]} value={String(enteredAmount || "")} editable={false} />

                  <TouchableOpacity onPress={submitChequeDetails} style={{ backgroundColor: "#2F81F5", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10 }}>
                    <Text style={{ fontFamily: "Montserrat-SemiBold", fontSize: 16, color: "white", textAlign: "center" }}>Submit</Text>
                  </TouchableOpacity>
                </>
              )}

            </View>
          </View>
        </Modal>


        <Modal
  visible={gatewayVisible}
  transparent={false}
  animationType="slide"
  onRequestClose={() => setGatewayVisible(false)}
>
  <RazorpayWebView
    amount={enteredAmount}
    onSuccess={async (data) => {
      // ✅ Razorpay returns payment_id as razorpay_payment_id
      const transaction_id = data?.razorpay_payment_id || data?.payment_id || "";

      setGatewayVisible(false);

      if (!transaction_id) {
        showAlert?.("Payment success but transaction id missing.", true);
        return;
      }

      // ✅ after success -> call submitPayment with transaction_id
      await handleSubmitAfterGateway(transaction_id);
    }}
    onFailure={(data) => {
      setGatewayVisible(false);
      showAlert?.("Payment cancelled/failed.", true);
    }}
  />
</Modal>
      </View>
    </Modal>

    
  );
}