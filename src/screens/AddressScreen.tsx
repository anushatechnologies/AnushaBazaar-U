import React from "react";
import {
View,
Text,
StyleSheet,
FlatList,
Pressable
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAddress } from "../context/AddressContext";

const AddressScreen = () => {

const navigation = useNavigation<any>();
const { addresses, selectAddress } = useAddress();

return(

<View style={styles.container}>

<Text style={styles.title}>
Select delivery address
</Text>

{/* CURRENT LOCATION */}

<Pressable
style={styles.currentLocation}
onPress={()=>navigation.navigate("SelectLocation")}
>

<Ionicons name="locate" size={20} color="#0A8754"/>

<Text style={styles.currentText}>
Use current location
</Text>

</Pressable>

{/* SAVED ADDRESSES */}

<FlatList
data={addresses}
keyExtractor={(item)=>item.id}
renderItem={({item})=>(

<Pressable
style={styles.card}
onPress={()=>{

selectAddress(item);
navigation.navigate("Payment");

}}
>

<Text style={styles.label}>
{item.label}
</Text>

<Text style={styles.address}>
{item.address}
</Text>

<Text style={styles.mobile}>
📱 {item.mobile}
</Text>

</Pressable>

)}
/>

{/* ADD NEW ADDRESS */}

<Pressable
style={styles.addBtn}
onPress={()=>navigation.navigate("AddAddress")}
>

<Text style={styles.addText}>
+ Add New Address
</Text>

</Pressable>

</View>

);

};

export default AddressScreen;

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#fff",
padding:20
},

title:{
fontSize:20,
fontWeight:"700",
marginBottom:20
},

currentLocation:{
flexDirection:"row",
alignItems:"center",
marginBottom:20
},

currentText:{
marginLeft:8,
color:"#0A8754",
fontWeight:"600"
},

card:{
backgroundColor:"#f6f7fb",
padding:15,
borderRadius:12,
marginBottom:12
},

label:{
fontWeight:"700"
},

address:{
color:"#555",
marginTop:3
},
mobile:{
color:"#0A8754",
fontSize:12,
fontWeight:"600",
marginTop:5
},

addBtn:{
backgroundColor:"#0A8754",
padding:16,
borderRadius:12,
alignItems:"center",
marginTop:20
},

addText:{
color:"#fff",
fontWeight:"700"
}

});