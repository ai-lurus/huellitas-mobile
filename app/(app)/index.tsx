import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text>Map Feed — FE-010</Text>
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
