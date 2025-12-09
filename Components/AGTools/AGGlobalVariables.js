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
// Shop Types with multilingual support (FR/EN/TH) and category type
// type: 1=beauty, 2=fitness/food, 3=work/retail, 4=girlsNight, 5=event
export const shopTypes = [
    { id: "0-default", text: "", textEn: "", textTh: "", type: 0 },
    { id: "mode", text: "Mode", textEn: "Fashion", textTh: "แฟชั่น", type: 3 },
    { id: "bar", text: "Bars", textEn: "Bars", textTh: "ร้านคาเฟ่", type: 2 },
    { id: "barbiers", text: "Barbiers", textEn: "Barbers", textTh: "ช่างตัดผม", type: 1 },
    { id: "coffee_shop", text: "Coffee shop", textEn: "Coffee shop", textTh: "ร้านกาแฟ", type: 2 },
    { id: "salon-de-massage", text: "Salon de massage", textEn: "Massage salon", textTh: "ร้านนวด", type: 1 },
    { id: "cigarette_shop", text: "E-cigarette shop", textEn: "E-cigarette store", textTh: "E-cigarette store", type: 3 },
    { id: "fleuristes", text: "Fleuristes", textEn: "Florists", textTh: "คนขายดอกไม้", type: 3 },
    { id: "commercants", text: "Commerçants", textEn: "Grocery store", textTh: "ร้านขายของชำ", type: 3 },
    { id: "instituts-de-beaute", text: "Instituts de beauté", textEn: "Beauty salons", textTh: "สถานเสริมความงาม", type: 1 },
    { id: "restauration-rapide", text: "Restauration rapide", textEn: "Fast Food", textTh: "Fast Food", type: 2 },
    { id: "restaurants", text: "Restaurants", textEn: "Restaurants", textTh: "ร้านอาหาร", type: 2 },
    { id: "boulangers", text: "Boulangers", textEn: "Bakers", textTh: "คนทำขนมปัง", type: 2 },
    { id: "cbd_shop", text: "CBD Shop", textEn: "CBD Shop", textTh: "CBD Shop", type: 3 },
    { id: "salon-de-coiffure", text: "Salon de coiffure", textEn: "Hair salon", textTh: "ร้านทำผม", type: 1 },
    { id: "dental-center", text: "Centre dentaire", textEn: "Dental Center", textTh: "ศูนย์ทันตกรรม", type: 1 },
    { id: "nail-studio", text: "Salon de manucure", textEn: "Nail Studio", textTh: "ร้านทำเล็บ", type: 1 },
    { id: "wellness-center", text: "Centre de bien-être", textEn: "Wellness Center", textTh: "ศูนย์สุขภาพ", type: 1 },
    { id: "eyebrows-eyelashes", text: "Soins sourcils et cils", textEn: "Eyebrows & eyelashes", textTh: "คิ้วและขนตา", type: 1 },
]

// Helper: Get shop type label based on language
// Usage: getShopTypeLabel(shopTypes, shop?.shopType?.id, lang)
export const getShopTypeLabel = (shopTypeId, lang = 'en') => {
    const type = shopTypes.find(cat => cat.id === shopTypeId);
    if (!type) return "";
    if (lang === "th") return type.textTh || type.text || "";
    if (lang === "fr") return type.text || "";
    return type.textEn || type.text || "";
}

// Helper: Get macro category slug from type number
export const shopTypeCategory = (type) => {
    switch(type) {
        case 1: return "beauty";
        case 2: return "fitness";
        case 3: return "work";
        case 4: return "girlsNight";
        case 5: return "event";
        default: return "";
    }
}

// Helper: Get type number from macro category slug
export const shopCategoryType = (category) => {
    switch(category) {
        case "beauty": return 1;
        case "fitness": return 2;
        case "work": return 3;
        case "girlsNight": return 4;
        case "event": return 5;
        default: return 0;
    }
}
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