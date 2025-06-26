import { useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Pressable, Image, Linking, ActivityIndicator, ScrollView, TouchableWithoutFeedback, TextInput, Modal, PermissionsAndroid, Platform } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import { Picker } from '@react-native-picker/picker';
// import Menu from '../Menu-bar/Menu'
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
// import { globalApiClient, apiClient } from '../../Pages/Services/API';
// import { BASE_API_URL } from '../Services/API'
import { toWords } from 'number-to-words';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { GlobalStyle, lightTheme } from '../GlobalStyles';



function Receipt({ navigation }) {
    const [showMenu, setShowMenu] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectClient, setselectClient] = useState();
    const [selectPaymode, setselectPaymode] = useState();
    const [filter, setFilter] = useState(false);
    // const [selectPayment, setSelectPayment] = useState(false);
    const [receiptData, setReceiptData] = useState([]);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);

    const [loading, setLoading] = useState(true);

    // const [showCustomAlert, setShowCustomAlert] = useState(false);

    // const [alertMessage, setAlertMessage] = useState(false);
    // const [showAlert, setShowAlert] = useState(false);
    const [allClients, setClients] = useState([]);

    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');

    const { showAlertModal, hideAlert } = useGlobalAlert();
    const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADgCAYAAAD17wHfAAAACXBIWXMAACxLAAAsSwGlPZapAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABcmSURBVHgB7Z1biBxXese/U7e+zV07UkY7drS2WG9GwSGEgB4M8b7oIcYhD95BsIFEDiiE5MEBQx4CK+S3wD6YhWywie3dkBAj+WVJ2Ae/xAY/DHkMzOzKseVZe6yLW1LPrXu6qqvq5HzVl+mZ6e6p6q77+X7Qnltb3V1V//qu5zsMiNRw48YN5fal21qtVtPseVtp1StayTI0/Jsz3VJdx1V4wVHw54JTULj4edi/ZRktG78yU3UVVXGZrXDlQHUPDMtWdM0t1Ov2/Py8/YP1H9g3b950gUgMBkTsvHjjRe3O+TuGWalohbpitMqmbmiaNkpUUcKESG3uWihU03GskmVaKNCN1Q0LiMghEUYMWre3z79dVNX5oqk2DL2o6kmJLShdcRqNUstxas3r9643yWqGD4kwZFB0P73003Jhd9E4mNktGZauQY5oCVHqaqEFe3uN5777nPXR9z+ygZgIEmEIXHjvQlF8KdbFQ9NZASQCRVk0K6amNhqb1zabQASGRDgmKDzbKZfdilnJinsZNaqh244NZsG09kmQ/iERBoCE55+uIOc1bZcSPKMhEZ4Cxng/v/DzGRldzbBAQZqg7VxaPNukGPIkJMIhoNU7UNUZVYcCWb0QUfQ6uatHIRH20c5s3i5DvTFFVi9autaxurqxD5JDIoRDl9MqqtNk9eKFXFXJRUjiSw8oRgPs/acXn67LJkYpRUjiSy9dMd5dv7sHN0GK7hzpRHjx3y7ONFQ+S+JLNzLFjNKI0KvxVYwzjtXKVRtZ3pFBjLkX4Yv//aK2vrn5Lcp2ZhvXVQ5+56mnnuQxXsytCLtxn6mzWSByQ8lg23dX7+5AjsilCMn1zDdeS1xxr3b/T+43IAfkSoRo/d556p05p6hPA5F/FL3+3NL57ay7qLkRIVk/OfGsYk1Yxb/KrlXMfJoerd/yvywviNjvHAlQPrxzXikuLt9aXoCMkmlLiJnPz6r3SHyEB1rFi4vnH2bNPc2sCKnoTgwC5+I0Hbbz5M8+24WMkLkLuOt+1sGZJwESx8FroiCujSy5p5myhOh+frH1cNFiTQMI4hSy4p5mRoQrt1aMXbAXKf4jgoBCnAGtmuYRG5kQIcZ/6H4CQYyJCWotrXFi6mMqUf+bIwESk4Jx4jO3nkllC2OqLSEmYKj7hQgT1Wjtba1uPYEUoUIKwQzor/9yaxF0pQIEESLcUQtTV79l7K88acLHwCEFpE6EKMCfXbx1zlVaRSCICGAO14sLs6XG8zuNNAgxVe4olSCIOMER/r+7/J1q0iWM1CRmui1oJEAiLnSmGHjN4bUHCZIKS0g9oESSJF3UTzwmxBjwI+1/ztqupQNBJAC2uj3YrRWTihETFWE3CUMuKJE0KmNqUsmaRN3Rc//67FlFcUtAECmBG2rjwepnVYiRxBIzWIgnARJpg1lOOe4VGImIEFvRqBOGSCuOpU/H2eIWuztKzdhEVoir6TtWS4jLkUiARFbApm+8ZiFiYhMh1gJxPSAQRIbAazbqYn5sJQr7JWOJivFE1oijhhiLJfSWJJEAiYyC7W3Ll5bnICIiFyEmYigTSmQdzJguiGsZIiBSEaIvjWMJgSByQFFcy1HEh5HGhBgHuraTyoXDBBEYztm22SjvrjyuhxkfRmYJKQ4k8ghe02HHh5GIcOmtPyhTHEjkFYwPcQMiCInQRYg+szq/RwV5ItfgDmBwIxz9hC7CO/fvzZEbSuSdMN3SUEW49NZSGdwWTUgjpCAstzRUEarz0+SGElIRhlsamgi95UnkhhKSgdf8/KVnJkpChiJCTMaYOqOiPCElRYvPTVLED0WEv/rqq8xuVUwQYbBx/zdnYEwmFuHirZUpGlNByI7qQnHcJM3EIiyATW4oQUAnSTMGE423QCuoWQdjm2HCPy6wGVU8RCpgGX/m4ntxB51p/w12GfDOGAZ1yxHfK72fiTgZZyTG2MEkzgx9B/5j1gEiTFxPXPwyA3WZg7si7pMr4k65rHYE1+25x7tnt4P4+J1U9X7DdsXft8SzxAM2GLhrDigbJM5owZUWomSxDzfx3uiPsS0hliQoIzo5XdEJy3ZZAXZF/GoZIkQIc0P8Fx8fitdeI1GGT9Ng27XVuzt+nz+WCGnviMlou5bKK0IIKDph7SCSxaI+WRMXwQe2ECUJMhyYqrj3fv35136t4VgiJCs4HgyUy64QnrB4QoCJCm8gHPgHwm39QFjlNSAmIog1DCxCsoLjoFwRB/pV8c1lyAZb4v2+6QpBAjEWQaxh4BLFevWbIgnQH4pwOYX1+0Rc0G9DdgSIiKQQ/Bjfu+K5zURQcEqb33a2wCKkuuDpoNspHu/jhQwRJ1oipidGtOZABKLkiJKSj+buQPNfsC7ILHMKiIGIi3WZecJjfw/ZFt9xZsTnell8FZ9PwcwqJXD8wDkrLZ23G7er1qinBbKEZAWHI+p6GPP9EtplhlzC2gml9zuflfABsw9OXV/r2xJiX1wL3NRl9JKmbf0Yxnw/BLxP5R+8Bv4IyCr6QuGgfevlOXP7F9tDt+L2bQnNgkFu6DEw9hNf3odsJV1C4dAqcuk+e1AOVHWk8fIlQm+tFI2tOELHJUMB5in2C4r47Or7ou75GhBDUXXhIY1I0PhyR+svlcuKY5eB8BAC/JFww+jC68FENthzUz8G4iQiQaMvLfDm7Zo56M++LCElZNpguxmWHsRRpcTECdireGxcb6UHcRzd5kPXGp4qQtwkkYrz3UZrJmX8FwBsQichDmDUot9TRVizbekPaFeArN1sTYwAjxEJcTA1Y/AEitOr+ZoUafehkACDQ0IcTEXRB1YYRooQzafsrqgqaoAkwODgMVPb9VOiA/aTDnJJR4pQ9tpgOwtKMeAEiKwp+xEQPQa5pCNFKLMrqoD6GmVBwwCzptTm1mWQSzp0PSGaTVNn50BC+jphiNBwrtJi4TaFFn+4eW2z2f15qCV8ImlxHntBob0EiQgV9cedYys9OxXliIc5VIRGQZXSFeXtThi6WMKHbm4djhfuB4oQe0V1phggGRi7dBqTiWi4TPFhu3Df30s6UIR3Pr0joQDRVaJETNSgp0FuKcDi2cVeuDfYHZ2eli4eJDc0HrDRWxxr6csW1lxJ734/UIQtx9RBKnAaGrmhcSGO9RXZ1yFqLXeEJRS+qmzxoLg7U0E5dlSpl4IZmq5148ITIlw6vzTxHtxZojPSj9zQ+Lks+zjFrtZOiLCuqlKJkAPQ4tyEkP3YN6Z0rwx4QoQFVZPGFSUrmDjLMs8zLTDV09oJEepFVZqkDG+PpicShEl8DrRO7uWICHEVPS63AAno9IfSEqXkuSxrptTT2o0XtSOCq9Vq0qwdFLUqKkmMZgtigkucoFk6f8c4IsIDoyBFPKh6A5uoLjgIF/i7DvDnObgviMcFF9zXIXJBsiuyrsI3K5WjlrCgqlKIkOd4VP0kCO/gTeEavtG/WShuICoukuvi28gmbWMXjQog5U2xUFeOWkLXcaSIB7mkJ3wUKEDwHidxwMVx9xHvVSjnjbFVNvUjopMhM6q23R4aWdHHKAF2cb197qN8D7Aio0tqaFqfO3oDFBkyow4wEmAffgSIKKBGKhB0SRUJs6SouZ7oVi6tSJIZ5RQPdvArwPZz3cjLOVzSG2RPhLKUJ0RWlGqDEEyA7W2/o88mK5LGhT0RYqoUck4nHpRehEEFyOMbS7EsY1zYE6HbsnMfD7pkBdMswM5ryhcX9oRXKhi5t4Rc8oWkaRcgItxe6RrqDy2hnf8aoczj7LMgQIRLeI4ORShFoV6+uyySFQG2kS9k6AmPa5xB/pFOhNkSoIe87igv5NsSdjKjUmXeMihAr2gvW4ZUil5RRLYTm0UBdlFlFaFh6XnPjsbu5qAQbIAX8OEAXOWRN0Efvm5WBYg44Ejlkkq/F31UiAvpqgJsTcV8Xxtck7fGQdli7UHDkZB1AcqINO4ojzEeRIunDN0GzHmTA/MlkjFeNxcCVCgmzCcc3NhOrEgunLLsJ3wh5skCcskSaNKIME7cvpXpwwlPiOSCZhtpRMhAiWw8w4BX81lwnlyIeRQgi3CURhqRSITxnVgR07wqEjCRCzGvFtCfJ5EfeiJkquICERpC9O9HKURyQfPD4XpC1cy7CGObo4lg50dUQsy7AFVQYz1XSSONO6ok4OJEIUQZLKAjrTtqqrm2hJ0Tm2khyiBA8Z53FWlFaDMO+ScRNycMIUoUA0rliiI9EWoFw4acwyOenTmKSYQoVxKGyytCGRC1wsRE2H794ELEHlTJsqCJnqMk6InwwLRksISJ32WDCnF4D+rx5+WjDOGC6+vz5omeCPVKPfciVIGn4gQHt4ijyVcdUJHXEmo1LffF+k6GNBUxR1hCzJMAxefYkC0zivREOD8/n3tL2IZ/CClhUiHmrxOGS2cFkZ4IN9Y3pBAh9xljxcW4QsxnK1p6bpBxcpgdvQmuDP2jnbgwVS5P8GRNPntB3ZTdIOMANXekRGHZdu6tYScuTJ3b41eIOW7GXpMxHrS5ax3dJFQttEAKWCrdntOEmOfVEKI0EcsQrLShaOpRS2i6rgUSoLRPeCrvul0houC6v8NxjQqor+V5ORJP6Y0xapp1u3VEhIV6/muFSNsl5am986IQUXAMlP8Vj09UYJ/wCCe0JU17MJZ8rihSssyj7uj97z4nhSVsk4k7Lw48WoacDz6S1RVF7ovS4NHe0e9/ZMuywp6326Oky8aljXaBXr6sKOJpbXXDOtHA3Wo6kiRnPCG+C0SiyHwOMDOKX0+I0HRsiVxSQJdUuqUzKWJLxL/SuqImdwaLsOI4TZAIEY9EMg2bOB3Zj315v2Xi1xMivH/vvlQi7NyJKTaMH6mtINLV2slFvTfBtYyWJM3cPcgaxoyIBd8AiWlhPCi0ht8PXFnf2oUDkIh2plTO5uEk6GwRJ/XxNt3D3MtAERZmTJmSMx0Y3pmlLBjHjHBDmfSex1TT7Rm6gSKsrlcbIBnCGm75neVCTAJ/t32s5UbEg6MtIfqqdoubIBnCTcKaFSVpIgLd0M4xlppOPNjLuwydtiYq9lJlSft4Hah2GAXkhnZoKfyItoaKcE5SEXZcpdeBCBUHnNfJDW2zYylHEp9DRbh5bbMp605NnWyp1Cn0MMHhxbL2hx7HskX5T2ir/3cjh//u1806SEo7dqH4ZVLc9nEkN7SDxfgJD3OkCBdUTbosaT+8bQ3pDj4+a4w8iiPsufoJwzZShDK7pF0U4NdBwtHsk4JLlJz2sSM6DHJFkVP3opDZJUVwFb4Q4lUgIfoGBSjc0KuyrpYfxiBXFDlVhLK7pAgJ0T8kwOHslWb3Bv3+VBGiSypj4f44fUKkGHE4ayTAwXiu6OrGwHZQX1ujSVy4PwIKUZQvrlLW9CRuux2NBDgEpW7uDP0b+GB7c3NX9gRNP5g15dT90Qd/g7Kgo6l+Ux1qyFTww8fAKy+dKTCV60B04CL97hWgL0POp6GNYMsB5zoD+E8ghrLvWPvWa3tDE5y+d+otMnsPiCN0JrZd5SmeYRoh3menTpjTGVQb7MefJRRs/2LbLr08V1JUpgHRhxcDfci8tYjsWci/VcTByf8objz/ABT/nQomZA6ufVkb9Zxge9Y36vtADKSzRCfnVtGbPvDHtBzJP6MSMl18W0Kk8YcNe+bsmWngnAExgLZVxM0uRbz4+5Afq7iGqyDESf9nsn7+QSv46PqDx6c9L5glvAluo+lQbHg6H4p48QUX3KyvTdzCz9AuPVDsFxQ/VtB7HgSEyhX+wZF+fWLMUrfNmnjf1/G9yz6WcFzQCo4qS/Qzlls5996FuZLOZoEIhAvKZVHMfkW4qq9A+tgVsd6HuDkLWb3JaRpsu7Z615clHC+2uwHK+e89+23uuIEtKdHeb1AUt6909iC8DMnijXt0hMWjbpdwQCv4+Iuth/1zZEYxdoKFrGE4tDcA5UKI7IqwkLhDr6996ydAxHlclFT4Gu4RT8ILnyBWEBm75oexYfl7z06TNZwM5TCjKpI53BOlEOQKCpN5gmS4P+E4exTiv7vFvUwtbIivW13RscPXBiJc0ArW/m8rUPJyolLDwk8uzhQWnHkgIgfFyT031hMkbvmNu/l6wsRGARFvehaNe1PNvBUfZOESwN7Zf1z9m2qgevrE9b4zP1v+tqHp1EVDSI8XC/7F1tcQkIldyWmunVqMJAgZ8FsXPPH/wYTQol+CEGGAoTaCuqFdQkmqVDc3HwFBSMyD9c9qMCbhZDZFPeSgxccyxQSRdbAk4bcmOIjQygtYsvDmaBCERHgliQA1wUGEV+O7CS4laQjZeGw6Y7uhXUJfkjT770/Pl7kq67gHQiJwbMXen389seEJvdtl59Mvd8gtJfIOXuN7d78OJQ8SfssZuaWEBBjohk6QjOknshXy5JYSeaXBnN2dH345cSzYJbLma3JLiTyC13SYAkSiWwEh3FJcU0Wr8Im8YKqmd01DyES7DEn4zM0qoyI+kQuU0vR2WHFgP7FMTaP4kMg6YceB/cSyIBfjwxZ3LSCIDBJFHNhPPKviRXz46LPfVClRQ2SN3ryYCIlvNIXwpc+VZ6pAEBnicXmrGkUc2E+s82E2Vjcs84kamVkniDBpTRlPYBUiD6MSGWdPk9qItBN0YtokJLanBGVMibQSZSZ0EImNK8QP6brKARBEitgzDhpxChBJdGbow88/f0SlCyIt4LW4v/4g9sUHgbZGC52PgTee32kUF2ZLKmPJvhdCalCAooyGo+tjb7NM/sJvC7FZmJ0qq4pK07yJ2PFqgXe/+kYI0IEESIf1+Rjcg9/bPSAhEnETdPOWKEiPC9gRonBNi+SaEnGALmjHAibayZWui10IkWJEIg76YsBEXNB+0nehd5I1lfkzBmNcB4IIGSxDbN/5uppEEmYQiRXr/UAFfSJs4i7E+yHVSRA8WDTZmwgLbEVLmwCR1Gcit69tblPTNzEp2IwdVy9oUFLtjvazcmvFeNjYXaS9EIkgeCUIXI4Uw2qIcclMBrJ6u+pQLZEIQq8E8bfQghSTGUvYDyVsiNPwEjCffrmTlgzoKDIpQmThJxdniot8ljsuWUWiB44lxKloj/70zh5khMyK0OMGaGe+s3yO4kQCSUML2jhkW4QdyD0lsuR+HicXIkSW3loqWwV1nqyiXHjWDzcgurbZhIySm/7M/f/ab2H2lM1VFENRDSByD1q/2udfPYK/20519vM0cmMJ+yGrmG/yYP36yaUIu9BUt/zhTUFbv7uXxdhvGLkWoYfIoP7Wb1+cZ4ZTBiKzOAo0v7nzxeOsZT79kH8Rdlj8p8Upt1KYJRc1W+TN9RyENCLsQmLMBlksuo+LdKvXG79sWCKLWtdm5oBzW6M+1HSB4rN1faf2qy8fNf76sQkSIJ0lPIKIF+cuXJhSmV0hy5gsKD6uFnfzlnTxg9wi7CLEuHh2sUhuavzILL4uJMJjUMwYD5jt5LX9evWbakNW8XUhEQ7jvQvFaaVVmVKNKSBCAa2eoZabD+r2Xp6znUEhEZ4GuaoTg1avpbGmzC7nKEiEQbi1Ykwf7EwbnBVJkKNBq+e42v6OpRyQ1RsNiXBcOu4qCfIQEt54kAjDQAhy1nBLusuKOlOkWsHRczXrrknCGw8SYdiIGBLOLxnTRaVUUDQjb6K0jJZtt5TGjn7QgnXKbIYBiTBqboAiRFmcndILhqUUnKKlF5xCJrp00L3UeMEyuWPt7LdMuHe/SaILHxJhEogED9Rq2pxRMAqqariOoyQpTq9P09ZtvVFomZVH1pN6wYZ7z1lw86PcrVhIIyTCNIFW89KKhgJdqJia25pRSpahuSVHQaFyjTNecDyhGtbwZBCKiqmKZ7GYqbrMZlyzDE9QB4Zlb1fqNtQ0F+bnbVjfsMm6Jcv/A37xpLo7gpLEAAAAAElFTkSuQmCC';


    const route = useRoute();
    const page = route.params?.page ?? null;


    useEffect(() => {
        if (page === 'home') {
            setModalVisible(true);
        } else {
            setModalVisible(false);
        }

        getAllReceipts();
        getClientsAll();
    }, [page]);



    const getAllReceipts = async () => {
        setLoading(true);
        try {
            const response = await TaskService.getMyReceipts();
            if (response.status == 1) {
                setReceiptData(response.data);
            }

            console.log('Receipt Data:', response.data);
            return response.data;
        } catch (error) {
            throw null;
        } finally {
            setLoading(false);
        }
    }

    const getClientsAll = () => {
        try {
            TaskService.getAllClients().then((response) => {
                if (response.status == 1) {
                    setClients(response.data || []);
                }
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    const handleGenerate = async () => {
        if (!selectClient) {
            showAlertModal('Please select a client.', true)
            return;
        }
        if (!selectPaymode) {
            showAlertModal('Please select a payment mode.', true)
            return;
        }
        if (!amount || isNaN(amount)) {
            showAlertModal('Please enter a valid amount.', true)
            return;
        }

        let userId = await AsyncStorage.getItem('user_id');
        let request = {
            "empId": userId,
            "clientId": selectClient,
            "paymentMode": selectPaymode,
            "amount": amount,
            "remarks": remarks,
        };
        try {
            const response = await TaskService.generateReceipt(request);

            if (response?.status == 1) {
                setModalVisible(false);
                showAlertModal('Receipt generated successfully.', false);
                setselectClient('');
                setselectPaymode('');
                getAllReceipts();
                setAmount('');
                setRemarks('');
            } else {
                showAlertModal(response?.data || 'Something went wrong.', true);
            }
        } catch (error) {
            console.error('Error while submitting payment:', error);
            Alert.alert('Error', 'Something went wrong while submitting the receipt.');
        }

    };

    const openPdfInBrowser = (url) => {
        if (!url || !url.startsWith('http')) {
            Alert.alert('Invalid URL', 'The URL is not valid or missing.');
            return;
        }

        Linking.openURL(url)
            .catch((err) => {
                console.error('Failed to open URL:', err);
                Alert.alert('Error', 'Unable to open PDF.');
            });
    };



    const generateAndSharePDF = async (item) => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                body {
                font-family: 'Arial', sans-serif;
                padding:20px;
                background-color: #fff;
                color: #000;
                }
                .paymentBox{ text-align:center; background-color:#fff; border-radius:24px; box-shadow:0px 8px 24px 0px #AAAAAA4F; padding:20px; margin-bottom:30px; }
                .paymentBox img{ margin-bottom:15px; }
                .paymentBox .payText{ font-size:16px; line-height:1.2; font-weight:400; color:#474747; margin-bottom:8px; }
                .paymentBox .inrText{ font-size:24px; line-height:1.2; font-weight:600; color:#0C0D36; margin-bottom:0; }

                .receBox{ background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:10px 25px 25px; margin-bottom:30px; }
                .receSubBox{ text-align:center; background-color:#F5F6F7; border-radius:12px;  margin-bottom:18px; padding:12px; }
                .receSubBox .receTitle{ font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin-bottom:10px; }
                .receSubBox .receSubTitle{ font-size:14px; line-height:1.2; font-weight:500; color:#707070; }

                .flexDv{ display:flex; justify-content:space-between; margin-bottom:14px; }
                .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; }
                .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:500; color:#0C0D36; }

                .border-line{ width:90%; border-top:1px dashed #EDEDED; height:1px; display:block; margin:0 auto 14px; }
                .remarks{ display:flex; align-items:center; background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:16px 30px; }
                .remarks .remTitle{ width:88px; font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin:0; }
                .remarks .remSubTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; flex:1; margin:0; padding-top:4px; }

            </style>
            </head>
            <body>
            <div class="paymentBox">
                <img src="${imageBase64}" style="width: 56px; height: 56px;" />
                <div class="payText">Payment Success!</div>
                <div class="inrText">INR ${item?.amount || 0}</div>
            </div>

            <div class="receBox">
                <div class="receSubBox">
                <div class="receTitle">Payment Receipt</div>
                <div class="receSubTitle">Receipt Number: ${item?.receiptId || ''}</div>
                </div>

                <div class="flexDv">
                <div class="sndTitle">Sender Name</div>
                <div class="sndSubTitle">${item?.generatedBy || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Receiver Name</div>
                <div class="sndSubTitle">${item?.receiverName || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Payment Date</div>
                <div class="sndSubTitle">${item?.createdAt || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Payment Method</div>
                <div class="sndSubTitle">${item?.paymentMode || ''}</div>
                </div>
                <div class="border-line">&nbsp;</div>
                <div class="flexDv">
                <div class="sndTitle">Amount</div>
                <div class="sndSubTitle">${item?.amount ? `INR ${item.amount}` : '0'} only</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Amount In Words</div>
                <div class="sndSubTitle">${toWords(item?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</div>
                </div>
            </div>

            <div class="remarks">
                <div class="remTitle">Remarks:</div>
                <div class="remSubTitle">${item?.remarks || ''}</div>
            </div>
            </body>
            </html>
            `;

        const receiptName = `Receipt_${item?.receiptId || 'Unknown'}`.replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize filename
        const options = {
            html: htmlContent,
            fileName: receiptName, // no .pdf
            directory: 'Documents',
            height: 841.89,
            width: 595.28,
        };


        try {
            const file = await RNHTMLtoPDF.convert(options);
            await Share.open({ url: `file://${file.filePath}` });
        } catch (err) {
            console.log('PDF Generation/Sharing Error:', err);
        }

    };


    const requestStoragePermission = async () => {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ]);
    
          return (
            granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED ||
            granted['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to download PDF.',
              buttonPositive: 'Allow',
            }
          );
    
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
    
      return true;
    };
    
      

    const generateAndDownloadPDF = async (item) => {
        const receiptName = `Receipt_${item?.receiptId || 'Unknown'}`.replace(/[^a-zA-Z0-9_-]/g, '');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                body {
                font-family: 'Arial', sans-serif;
                padding:40px;
                background-color: #fff;
                color: #000;
                }
                .paymentBox{ text-align:center; background-color:#fff; border-radius:24px; box-shadow:0px 8px 24px 0px #AAAAAA4F; padding:20px; margin-bottom:30px; }
                .paymentBox img{ margin-bottom:15px; }
                .paymentBox .payText{ font-size:16px; line-height:1.2; font-weight:400; color:#474747; margin-bottom:8px; }
                .paymentBox .inrText{ font-size:24px; line-height:1.2; font-weight:600; color:#0C0D36; margin-bottom:0; }

                .receBox{ background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:10px 25px 25px; margin-bottom:30px; }
                .receSubBox{ text-align:center; background-color:#F5F6F7; border-radius:12px;  margin-bottom:18px; padding:12px; }
                .receSubBox .receTitle{ font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin-bottom:10px; }
                .receSubBox .receSubTitle{ font-size:14px; line-height:1.2; font-weight:500; color:#707070; }

                .flexDv{ display:flex; justify-content:space-between; margin-bottom:14px; }
                .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; }
                .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:500; color:#0C0D36; }

                .border-line{ width:90%; border-top:1px dashed #EDEDED; height:1px; display:block; margin:0 auto 14px; }
                .remarks{ display:flex; align-items:center; background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:16px 30px; }
                .remarks .remTitle{ width:88px; font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin:0; }
                .remarks .remSubTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; flex:1; margin:0; padding-top:4px; }

            </style>
            </head>
            <body>
            <div class="paymentBox">
                <img src="${imageBase64}" style="width: 56px; height: 56px;" />
                <div class="payText">Payment Success!</div>
                <div class="inrText">INR ${item?.amount || 0}</div>
            </div>

            <div class="receBox">
                <div class="receSubBox">
                <div class="receTitle">Payment Receipt</div>
                <div class="receSubTitle">Receipt Number: ${item?.receiptId || ''}</div>
                </div>

                <div class="flexDv">
                <div class="sndTitle">Sender Name</div>
                <div class="sndSubTitle">${item?.generatedBy || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Receiver Name</div>
                <div class="sndSubTitle">${item?.receiverName || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Payment Date</div>
                <div class="sndSubTitle">${item?.createdAt || ''}</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Payment Method</div>
                <div class="sndSubTitle">${item?.paymentMode || ''}</div>
                </div>
                <div class="border-line">&nbsp;</div>
                <div class="flexDv">
                <div class="sndTitle">Amount</div>
                <div class="sndSubTitle">${item?.amount ? `INR ${item.amount}` : '0'} only</div>
                </div>
                <div class="flexDv">
                <div class="sndTitle">Amount In Words</div>
                <div class="sndSubTitle">${toWords(item?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</div>
                </div>
            </div>

            <div class="remarks">
                <div class="remTitle">Remarks:</div>
                <div class="remSubTitle">${item?.remarks || ''}</div>
            </div>
            </body>
            </html>
            `;

        const options = {
            html: htmlContent,
            fileName: receiptName,
            directory: 'Documents',
            height: 841.89,
            width: 595.28,
        };

        try {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
              Alert.alert('Permission Denied', 'Cannot save the PDF without storage permission.');
              return;
            }
            setLoading(true)
            const file = await RNHTMLtoPDF.convert(options);
        
            // Share the file using react-native-share
            const shareOptions = {
              title: 'Save Receipt PDF',
              url: `file://${file.filePath}`,
              type: 'application/pdf',
              failOnCancel: false,
            };
        
            const result = await Share.open(shareOptions);
        
            if (!result.dismissedAction) {
              Alert.alert('Success', 'Receipt shared successfully.');
              setLoading(false)
            }
        
            console.log('PDF saved at:', file.filePath);
            setLoading(false)
          } catch (err) {
            console.log('PDF Generation/Sharing Error:', err);
            setLoading(false)
          }
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Receipt</Text>
                    </TouchableOpacity>
                    {/* <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
                            <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
                        </TouchableOpacity>
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                    </View> */}
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, }}>
                    <View style={{ flex: 1, position: 'relative', }}>
                        <TextInput
                            style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                            placeholder="Search"
                            placeholderTextColor="#0C0D36"
                        />
                        <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                    </View>
                    <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                        <Image style={{ width: 25, height: 25, }} source={require('../../assets/filter.png')} />
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    {Object.entries(receiptData).map(([dateKey, receipts]) => {
                        return (
                            <View key={dateKey}>
                                <Text style={styles.title}>{dateKey}</Text>

                                {receipts.map((item, index) => {
                                    const dateObj = new Date(item.createdAt);
                                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


                                    return (
                                        <View key={item.id} style={{ marginBottom: 15 }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                                                    <Image style={{ width: 23, height: 30 }} source={require('../../assets/pdf.png')} />

                                                    <View style={{ paddingLeft: 12 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="tail"
                                                            style={{
                                                                width: 180,
                                                                fontFamily: 'Montserrat_500Medium',
                                                                fontSize: 16,
                                                                color: '#0C0D36',
                                                                paddingBottom: 3,
                                                            }}>
                                                            {item.receiptId || `Receipt Copy ${index + 1}`}
                                                        </Text>
                                                        <Text style={{
                                                            fontFamily: 'Montserrat_500Medium',
                                                            fontSize: 12,
                                                            color: '#0C0D36',
                                                        }}>
                                                            Created at {formattedTime}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <TouchableWithoutFeedback onPress={() => setActiveMenuIndex(null)}>
                                                    <View>
                                                        <Pressable
                                                            style={[styles.touchBtn, { paddingHorizontal: 4 }]}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenuIndex(activeMenuIndex === `${dateKey}_${index}` ? null : `${dateKey}_${index}`);
                                                            }}>
                                                            <Image style={{ width: 4, height: 23 }} source={require('../../assets/dotimg1.png')} />
                                                        </Pressable>

                                                        {activeMenuIndex === `${dateKey}_${index}` && (
                                                            <View style={styles.viewBx}>
                                                                <TouchableOpacity
                                                                    style={styles.viewText}
                                                                    onPress={() => {
                                                                        navigation.navigate('Receiptview', { receiptId: item.id });
                                                                        setActiveMenuIndex(null);
                                                                    }}>
                                                                    <Text style={styles.downloadText}>View</Text>
                                                                </TouchableOpacity>

                                                                <TouchableOpacity
                                                                    style={styles.viewText}
                                                                    onPress={ () => generateAndDownloadPDF(item)}>
                                                                    <Text style={styles.downloadText}>Download</Text>
                                                                </TouchableOpacity>
                                                                
                                                                <TouchableOpacity style={styles.viewText} onPress={() => { generateAndSharePDF(item) }}>
                                                                    <Text style={styles.downloadText}>Share</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </TouchableWithoutFeedback>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>


                {/* Filter Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={filter}
                    onRequestClose={() => setFilter(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Filter by:</Text>
                                <TouchableOpacity onPress={() => setFilter(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={styles.label}>Date Range</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                                        <View>

                                        </View>
                                        <View></View>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Client</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                        style={styles.picker} // Apply text color here
                                        dropdownIconColor={lightTheme.inputText}
                                            selectedValue={selectClient}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectClient(itemValue)
                                            }>
                                            <Picker.Item label="Arun Sarkar" value="Arun Sarkar" />
                                            <Picker.Item label="Arijit Sarkar" value="Arijit Sarkar" />
                                        </Picker>
                                    </View>
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', paddingVertical: 25, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Reset All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Apply Filters (3)</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

            </ScrollView>



            {/* Create Btn */}
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createBtn}>
                <Text style={styles.createText}>Create</Text>
                <View>
                    <Image style={{ width: 16, height: 16, marginLeft: 8, marginTop: 8 }} source={require('../../assets/pen.png')} />
                </View>
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                            <Text style={styles.modalText}>Create Receipt:</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                            </TouchableOpacity>
                        </View>
                        {/* <Text style={styles.label}>Client Name</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectClient} onValueChange={setselectClient}
                            >
                                <Picker.Item label="Select Client" value=""  />
                                {allClients.map((client) => (
                                    <Picker.Item key={client.id} label={client.client_name} value={client.id} dropdownIconColor={lightTheme.inputText}/>
                                ))}
                            </Picker>
                        </View> */}

                        <Text style={styles.label}>Client Name</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectClient}
                                onValueChange={setselectClient}
                                style={styles.picker} // Apply text color here
                                dropdownIconColor={lightTheme.inputText} // Android only
                            >
                                <Picker.Item label="Select Client" value="" />
                                {allClients.map((client) => (
                                    <Picker.Item
                                        key={client.id}
                                        label={client.client_name}
                                        value={client.id}
                                    />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Payment Mode</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={selectPaymode} onValueChange={setselectPaymode}
                                 style={styles.picker} // Apply text color here
                                dropdownIconColor={lightTheme.inputText} // Android only
                            >
                                <Picker.Item label="Select Payment Mode" value="" />
                                <Picker.Item label="Cash" value="Cash" />
                                <Picker.Item label="UPI" value="UPI" />
                                <Picker.Item label="Net Banking" value="Net Banking" />
                            </Picker>
                        </View>

                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Amount"
                            placeholderTextColor="#0C0D36"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Placeholder"
                            placeholderTextColor="#0C0D36"
                            value={remarks}
                            onChangeText={setRemarks}
                        />

                        <TouchableOpacity
                            onPress={handleGenerate}
                            style={{
                                backgroundColor: '#2F81F5',
                                borderRadius: 28,
                                paddingVertical: 16,
                                paddingHorizontal: 10,
                            }}>
                            <Text style={{
                                fontFamily: 'Montserrat_600SemiBold',
                                fontSize: 16,
                                color: 'white',
                                textAlign: 'center',
                            }}>Generate</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

                        
            {loading && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Proccessing...</Text>
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({

     label: {
    fontSize: 16,
    marginBottom: 8,
    color: lightTheme.text,
  },
  pickerContainer: {
    backgroundColor: lightTheme.inputBackground,
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    height: 50,
    color: lightTheme.inputText, // Works on iOS and sometimes Android
  },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 2,
        marginBottom: 8,
        fontFamily: 'Montserrat_500Medium',
    },

    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#2F81F5',
        marginVertical: 20,
    },
    viewBx: {
        width: 130,
        backgroundColor: '#fff',
        borderRadius: 15,
        position: 'absolute',
        right: 12,
        top: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        paddingVertical: 11,
    },
    viewText: {
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    downloadText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#0C0D36',
    },
    createBtn: {
        position: 'absolute',
        right: 15,
        bottom: 100,
        backgroundColor: '#EBF2FB',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 21,
    },
    createText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 15,
        color: '#3085FE',
    },

    // Modal Start 
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContainer: {
        width: '100%',
        padding: 15,
        backgroundColor: '#fff',
        borderTopEndRadius: 20,
        borderTopLeftRadius: 20,
    },
    modalText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
    },
    label: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 15,
        color: '#0C0D36',
        paddingBottom: 10,
    },
    input: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    pickerContainer: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 0,
        marginBottom: 15,
        borderRadius: 10,
    },
    textarea: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },


})

export default Receipt
