import firestore from "@react-native-firebase/firestore";

firestore()._setSettings({
    host: "firestore.googleapis.com",
    ssl: true,
    databaseId: "seeu-asia",
});

export default firestore;