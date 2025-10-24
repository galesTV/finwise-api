import '@react-native-firebase/firestore';

declare module '@react-native-firebase/firestore' {
  interface Timestamp {
    toDate(): Date;
  }
}