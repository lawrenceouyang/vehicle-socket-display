//React
import React from "react"
import Avatar from 'material-ui/Avatar';

export default class SmartAvatar extends React.Component {

    constructor(props){
        super(props);
        this.state = {
         };
    }

    getAcronym(text){
        var indexOfSpace=text.indexOf(' ');
        if (indexOfSpace >=0){
            return (text[0]+text[indexOfSpace+1]).toUpperCase();
        }
        else{
            return (text.substr(0,2)).toUpperCase();
        }
    };

    getAvatarBackground(text){
        var letter = text.substr(0,1);
        var h=(letter.toLowerCase().charCodeAt(0) - 97)*25;
        return "hsl(" + h + ",89%,54%)";
    }

    render(){
        var {text, table} = this.props;
        // Redirect to login page if there permission denied error
        var style={};
        if (!table) style={position:"absolute", left:"16px", right: "16px"};
        return(
          <Avatar  color="#fff"
          backgroundColor={this.getAvatarBackground(text)}
          size={40} style={style}>
          {this.getAcronym(text)}
          </Avatar>)
    }
}