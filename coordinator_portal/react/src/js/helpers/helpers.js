import Moment from "moment"

export function validateApiCall (target, name, descriptor) {
    console.log("Validating api call");
    console.log(target, name, descriptor);
};

export const  formatAmPm = (strDate) => {
    var strTime = Moment.utc(strDate).format("h:mm A");
    return strTime;
};

export const compareTimestamp = (a,b) => {
        if (a.checkin_timestamp > b.checkin_timestamp)
            return -1;
        if (a.checkin_timestamp < b.checkin_timestamp)
            return 1;
        return 0;
};