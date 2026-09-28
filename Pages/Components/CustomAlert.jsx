import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

const ALERT_CONFIG = {
    success: {
        icon: 'checkmark-circle',
        color: '#16A34A',
        background: '#DCFCE7',
        title: 'Success',
    },
    error: {
        icon: 'close-circle',
        color: '#DC2626',
        background: '#FEE2E2',
        title: 'Error',
    },
    warning: {
        icon: 'alert-circle',
        color: '#D97706',
        background: '#FEF3C7',
        title: 'Warning',
    },
};

const CustomAlert = ({
    visible,
    type = 'success',
    title,
    message,
    onClose,
}) => {
    const config = ALERT_CONFIG[type] || ALERT_CONFIG.success;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: config.background },
                        ]}
                    >
                        <Ionicons
                            name={config.icon}
                            size={42}
                            color={config.color}
                        />
                    </View>

                    <Text style={styles.title}>
                        {title || config.title}
                    </Text>

                    <Text style={styles.message}>
                        {message}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: config.color },
                        ]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            OK
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    modalContainer: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },

    iconContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },

    title: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 21,
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 10,
    },

    message: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 22,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },

    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
    },
});

export default CustomAlert;