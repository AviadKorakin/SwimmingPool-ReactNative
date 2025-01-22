import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CustomHeaderProps {
    title: string | ((props: { children: string }) => React.ReactNode);
    headerRight?: React.ReactNode;
    headerLeft?: React.ReactNode;
    backgroundColor?: string; // Allow setting custom background color
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title,headerLeft, headerRight, backgroundColor = '#000000' }) => {
    // Handle functional title or string
    const renderTitle =
        typeof title === 'function' ? title({ children: 'Default Title' }) : title;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.left}>{headerLeft}</View>
            <Text style={styles.title}>{renderTitle}</Text>
            <View style={styles.right}>{headerRight}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
        paddingHorizontal: 15,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center', // Center the title
        flex: 1, // Allow it to grow in the center
    },
    left: {
        marginRight: 15, // Space between the title and right
        flexDirection: 'row',
        alignItems: 'center',
    },
    right: {
        fontSize: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default CustomHeader;
