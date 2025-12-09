import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';

export default function InputDynamic(
    Label,
    defaultValue={
        text:[],
    },
){
    // this will be attached with each input onChangeText =>        cela sera joint à chaque entrée onChangeText
    const [textValue, setTextValue] = useState("");
    // our number of inputs, we can add the length or decrease =>   notre nombre d'entrées, nous pouvons ajouter la longueur ou diminuer
    const [numInputs, setNumInputs] = useState(0);
    // all our input fields are tracked with this array =>          tous nos champs d'entrée sont suivis avec ce tableau
    const refInputs = useRef([]);
    
    const textValues = []
    const inputs = []

    for(let i=0; i < numInputs; i++){
        inputs.push(
            <View key={i} style={[styles.inputsContainer]}>
                <TextInput
                    style={[styles.input]}
                    onChangeText={value => setInputValue(i, value)}
                    value={refInputs.current[i]}
                    defaultValue={defaultValue.text[i]}
                    placeholder={"Descriptif"}
                />
                <TouchableOpacity onPress={()=> removeInput(i)}>
                    <Text>Remove</Text>
                </TouchableOpacity>
            </View>
        )
        textValues.push(refInputs.current[i])
    }
    
    const setInputValue = (index, value) =>{
        const inputs = refInputs.current
        inputs[index] = value
        setTextValue(value)
    }
    
    const addInput = () =>{
        refInputs.current.push("")
        setNumInputs(value => value + 1)
    }
    
    const removeInput = (i) =>{
        refInputs.current.splice(i, 1)[0]
        setNumInputs(value => value - 1)
    }

    const render = () =>{
        return(<>
            <View style={[styles.container]}>
                {inputs}
                <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginVertical:14}}>
                    <Text style={[{marginBottom:0}]}>{Label} :</Text>
                    <View style={{flexDirection:"row",alignItems:"center"}}>
                        <TouchableOpacity onPress={addInput}>
                            <Text>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>)
    }

    useEffect(()=>{
        setNumInputs(defaultValue.text.length)
        refInputs.current = defaultValue.text
    },[defaultValue])

    return {textValues,render}
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:"#fff",
    },
    inputsContainer:{
        marginVertical:4,
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
    },
    input:{
        backgroundColor:"#fff",
        color:"#000",
        borderRadius:8,
        height:40,
    },
})