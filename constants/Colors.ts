const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    studentColor: '#32CD32',
    error: '#d9534f', // Example for error messages
    success: '#4CAF50', // Example for success
    warning: '#FFC107', // Example for warnings
    primary: tintColorLight,
    secondary: '#FFD700', // Example for additional usage
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    studentColor: '#32CD32',
    error: '#d9534f', // Consistent across themes
    success: '#4CAF50', // Consistent across themes
    warning: '#FFC107', // Consistent across themes
    primary: tintColorDark,
    secondary: '#FFD700', // Consistent across themes
  },
};

export default colors;
