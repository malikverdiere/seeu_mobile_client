import fr from "./fr.json";
import en from "./en.json";
import th from "./th.json";
import { getLocales } from "react-native-localize";

const deviceLanguage = getLocales()[0].languageCode;

const data = {
    fr,
    en,
    th
};

export function setAppLang(){
    let trad = deviceLanguage;
    if (!data.hasOwnProperty(trad)) {
        trad = "en";
    }
    return trad;
}

export function traductor(keyWord = "NOT_DEFINE"){
    let lang = setAppLang();
    return data[lang].hasOwnProperty(keyWord) ? data[lang][keyWord] : data[lang]["NOT_DEFINE"];
};