import { Platform, StatusBar } from "react-native"
import { Google_MAP_API_KEY } from "@env"

export const primaryColor="#6857E5"
export const secondaryColor="#67E8CF"
export const tertiaryColor="#FFE6CC"
export const bottomTarSpace=100
export const boxShadow = {
    shadowColor:"#000",
    shadowOffset:{width: -2, height: 4},
    shadowOpacity:0.2,
    shadowRadius:3,
    elevation:20,
}
export const boxShadowInput = {
    shadowColor:"#000",
    shadowOffset:{width: -2, height: 2},
    shadowOpacity:0.2,
    shadowRadius:3,
    elevation:3,
}
export const statusBarHeigth = Platform.OS === "android" ? StatusBar.currentHeight : 0
export const API_KEY = Google_MAP_API_KEY
export const days = [
    "Lun",
    "Mar",
    "Mer",
    "Jeu",
    "Ven",
    "Sam",
    "Dim",
]
export const shopTypes = [
    {id: "0-default", text: ""},
    {id: "mode", text: "Mode"},
    {id: "bar", text: "Bars"},
    {id: "barbiers", text: "Barbiers"},
    {id: "coffee_shop", text: "Coffee shop"},
    {id: "cigarette_shop", text: "E-cigarette shop"},
    {id: "fleuristes", text: "Fleuristes"},
    {id: "commercants", text: "Commerçants"},
    {id: "instituts-de-beaute", text: "Instituts de beauté"},
    {id: "restauration-rapide", text: "Restauration rapide"},
    {id: "restaurants", text: "Restaurants"},
    {id: "boulangers", text: "Boulangers"},
    {id: "cbd_shop", text: "CBD Shop"},
    {id: "salon-de-coiffure", text: "Salon de coiffure"}
]
export const campaignTypes = [
    {id: "classic", text: "Classique"},
    {id: "student", text: "Étudiant"},
    {id: "ladies_night", text: "Ladies Night"},
    {id: "lunch", text: "Offres de déjeuner"},
]
export const promotionType = [
    {id:"standard",text:"Standard"},
    {id:"reduction",text:"Réduction"},
    {id:"free",text:"Produit offert"},
    {id:"buyFree",text:"1 Acheté = 1 Offert"},
]