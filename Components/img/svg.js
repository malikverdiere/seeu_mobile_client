import { StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, G, Text, TSpan, Circle } from 'react-native-svg';
import { primaryColor } from '../AGTools';

const default_size = 40
const viewBox_default = "0 0 40 40"

export function TabHome({ width = default_size, height = default_size, colorIcon = "#fff" }) {
    return (<View style={[{ flex: 1 }]}>
        <Svg
            width={width}
            height={height}
            viewBox={viewBox_default}
            fill={colorIcon}
        >
            <G transform="translate(10 8)">
                <Path
                    d="M18.5315 4.82449L12.7771 0.799144C11.9569 0.26419 10.9939 -0.00978197 10.0149 0.0133115C9.03593 0.0364049 8.08691 0.355481 7.29283 0.928515L2.28759 4.83498C1.75923 5.28855 1.32838 5.8446 1.02112 6.46949C0.713866 7.09437 0.536583 7.7751 0.5 8.47047V15.363C0.500228 16.5878 0.986258 17.7626 1.85148 18.6297C2.71671 19.4967 3.8905 19.9852 5.11538 19.988H15.8846C17.1085 19.9875 18.2822 19.5011 19.1477 18.6356C20.0131 17.7702 20.4995 16.5965 20.5 15.3726V8.60072C20.4635 7.86658 20.2687 7.14901 19.9289 6.49721C19.5891 5.84541 19.1124 5.2748 18.5315 4.82449ZM11.2517 15.9923C11.2517 16.191 11.1728 16.3815 11.0323 16.522C10.8918 16.6625 10.7013 16.7415 10.5026 16.7415C10.3039 16.7415 10.1134 16.6625 9.97291 16.522C9.83242 16.3815 9.7535 16.191 9.7535 15.9923V12.9958C9.7535 12.7971 9.83242 12.6066 9.97291 12.4661C10.1134 12.3256 10.3039 12.2467 10.5026 12.2467C10.7013 12.2467 10.8918 12.3256 11.0323 12.4661C11.1728 12.6066 11.2517 12.7971 11.2517 12.9958V15.9923Z"
                    fill={colorIcon}
                />
            </G>
        </Svg>
    </View>)
}

export function TabRewards({ width = default_size, height = default_size, colorIcon = "#fff" }) {
    const stroke_width = 1.5
    return (<View style={[{ flex: 1 }]}>
        <Svg
            width={width}
            height={height}
            viewBox={viewBox_default}
            fill={colorIcon}
        >
            <G transform="translate(9 8)">
                <Path
                    d="M19.8787 8.99866H3.06207V16.9987C3.06207 19.9987 4.11311 20.9987 7.26623 20.9987H15.6746C18.8277 20.9987 19.8787 19.9987 19.8787 16.9987V8.99866Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M21.4868 5.99871V6.99871C21.5206 7.2691 21.4894 7.54326 21.3958 7.80055C21.3021 8.05785 21.1483 8.29156 20.9459 8.4841C20.7435 8.67665 20.4979 8.82299 20.2274 8.91213C19.957 9.00127 19.6689 9.03087 19.3847 8.99871H3.61908C3.33392 9.03556 3.04367 9.00922 2.77097 8.92174C2.49828 8.83426 2.25053 8.68802 2.04704 8.49441C1.84355 8.3008 1.68983 8.06508 1.59789 7.80563C1.50595 7.54618 1.47826 7.27002 1.51699 6.99871V5.99871C1.47826 5.7274 1.50595 5.45125 1.59789 5.1918C1.68983 4.93235 1.84355 4.69662 2.04704 4.50302C2.25053 4.30941 2.49828 4.16316 2.77097 4.07568C3.04367 3.9882 3.33392 3.96186 3.61908 3.99871H19.3847C19.6689 3.96655 19.957 3.99616 20.2274 4.08529C20.4979 4.17443 20.7435 4.32078 20.9459 4.51332C21.1483 4.70586 21.3021 4.93958 21.3958 5.19687C21.4894 5.45416 21.5206 5.72832 21.4868 5.99871Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M11.1235 3.9986H5.32172C5.1489 3.82026 5.0556 3.58505 5.06148 3.34254C5.06736 3.10003 5.17197 2.86916 5.35325 2.6986L6.84573 1.2786C7.03462 1.10089 7.28954 1.00122 7.55518 1.00122C7.82082 1.00122 8.07574 1.10089 8.26463 1.2786L11.1235 3.9986Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M17.6716 3.9986H11.8698L14.7286 1.2786C14.9175 1.10089 15.1725 1.00122 15.4381 1.00122C15.7037 1.00122 15.9587 1.10089 16.1475 1.2786L17.64 2.6986C17.8213 2.86916 17.9259 3.10003 17.9318 3.34254C17.9377 3.58505 17.8444 3.82026 17.6716 3.9986Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M8.28572 8.99866V14.1387C8.2848 14.3196 8.33548 14.4974 8.43238 14.653C8.52928 14.8087 8.66877 14.9365 8.83596 15.0227C9.00315 15.1089 9.1918 15.1503 9.38179 15.1426C9.57179 15.1348 9.75601 15.0782 9.91483 14.9787L10.9028 14.3587C11.0744 14.2511 11.2754 14.1938 11.4809 14.1938C11.6864 14.1938 11.8873 14.2511 12.0589 14.3587L12.9944 14.9587C13.1524 15.0577 13.3357 15.1143 13.5248 15.1225C13.7139 15.1306 13.9018 15.0901 14.0686 15.0051C14.2355 14.9201 14.3751 14.7938 14.4728 14.6395C14.5704 14.4852 14.6225 14.3087 14.6235 14.1287V8.99866H8.28572Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
        </Svg>
    </View>)
}

export function TabShops({ width = default_size, height = default_size, colorIcon = "#fff" }) {
    const stroke_width = 1.5
    return (<View style={[{ flex: 1 }]}>
        <Svg
            width={width}
            height={height}
            viewBox={viewBox_default}
            fill={colorIcon}
        >
            <G transform="translate(9 8)">
                <Path
                    d="M2.21851 10.22V14.71C2.21851 19.2 4.08205 21 8.73062 21H14.311C18.9596 21 20.8231 19.2 20.8231 14.71V10.22"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M11.5259 11C11.9649 11.0081 12.4006 10.9251 12.8036 10.7566C13.2066 10.5881 13.5675 10.3381 13.8619 10.0234C14.1563 9.70872 14.3773 9.33668 14.5101 8.93242C14.643 8.52816 14.6845 8.10107 14.6318 7.68L13.9485 1H9.11359L8.41991 7.68C8.36726 8.10107 8.40876 8.52816 8.54159 8.93242C8.67441 9.33668 8.89546 9.70872 9.18986 10.0234C9.48426 10.3381 9.84516 10.5881 10.2481 10.7566C10.6511 10.9251 11.0868 11.0081 11.5259 11Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M18.0587 11C18.5417 11.0096 19.0211 10.9188 19.4646 10.7339C19.9081 10.5489 20.3053 10.2741 20.6293 9.92798C20.9532 9.58188 21.1964 9.17259 21.3424 8.72781C21.4883 8.28304 21.5337 7.81316 21.4753 7.35L21.1854 4.6C20.8127 2 19.7774 1 17.0648 1H13.9071L14.6318 8.01C14.7357 8.82298 15.1392 9.57264 15.7685 10.1217C16.3978 10.6708 17.2109 10.9826 18.0587 11Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M4.94129 11C5.78853 10.984 6.60113 10.6724 7.22911 10.1228C7.85708 9.57326 8.25799 8.8228 8.35782 8.01L8.58559 5.8L9.08255 1H5.92482C3.21229 1 2.17696 2 1.80425 4.6L1.52472 7.35C1.46633 7.81316 1.51165 8.28304 1.65761 8.72781C1.80358 9.17259 2.04679 9.58188 2.37075 9.92798C2.69472 10.2741 3.09187 10.5489 3.53536 10.7339C3.97885 10.9188 4.45833 11.0096 4.94129 11Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M11.526 16C11.1743 15.9509 10.8155 15.9817 10.4783 16.09C10.1411 16.1983 9.8347 16.381 9.58343 16.6237C9.33215 16.8664 9.14295 17.1624 9.03086 17.4881C8.91876 17.8138 8.88685 18.1603 8.93768 18.5V21H14.1143V18.5C14.1651 18.1603 14.1332 17.8138 14.0211 17.4881C13.909 17.1624 13.7198 16.8664 13.4685 16.6237C13.2172 16.381 12.9108 16.1983 12.5736 16.09C12.2364 15.9817 11.8777 15.9509 11.526 16Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
        </Svg>
    </View>)
}

export function TabAccount({ width = default_size, height = default_size, colorIcon = "#fff" }) {
    const stroke_width = 1.5
    return (<View style={[{ flex: 1 }]}>
        <Svg
            width={width}
            height={height}
            viewBox={viewBox_default}
            fill={colorIcon}
        >
            <G transform="translate(10 8)">
                <Path
                    d="M9.5 11C10.4889 11 11.4556 10.7068 12.2779 10.1574C13.1001 9.60794 13.741 8.82705 14.1194 7.91342C14.4978 6.99979 14.5969 5.99445 14.4039 5.02455C14.211 4.05464 13.7348 3.16373 13.0355 2.46447C12.3363 1.76521 11.4454 1.289 10.4755 1.09608C9.50555 0.903149 8.50021 1.00217 7.58658 1.38061C6.67295 1.75904 5.89206 2.39991 5.34265 3.22215C4.79324 4.0444 4.5 5.0111 4.5 6C4.5 7.32608 5.02678 8.59785 5.96447 9.53554C6.90215 10.4732 8.17392 11 9.5 11Z"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M18.09 21C18.09 17.13 14.24 14 9.49997 14C4.75997 14 0.909973 17.13 0.909973 21"
                    stroke={colorIcon}
                    fill={primaryColor}
                    strokeWidth={stroke_width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
        </Svg>
    </View>)
}