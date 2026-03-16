import { View, Text, StyleSheet } from 'react-native';

export default function SignInScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text>Sign In — FE-002</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
