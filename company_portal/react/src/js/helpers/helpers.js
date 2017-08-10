export function validateApiCall (target, name, descriptor) {
    console.log("Validating api call");
    console.log(target, name, descriptor);
};

export const  formatAmPm = (strDate) => {
    var date= new Date("0","0","0", strDate.substr(11,2), strDate.substr(14,2));
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
};

export const compareTimestamp = (a,b) => {
        if (a.checkin_timestamp > b.checkin_timestamp)
            return -1;
        if (a.checkin_timestamp < b.checkin_timestamp)
            return 1;
        return 0;
};