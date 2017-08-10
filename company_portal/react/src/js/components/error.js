//React
import React from "react"

export default class ErrorMessage extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            errorMessages: {
                "500": "Oops something went wrong :(",
                "404": "Not Found",
                "401": "Permission Denied",
                "403": "Permission Denied"
            }
         };
    }

    render(){
        var {errorCode} = this.props;
        // Redirect to login page if there permission denied error
        if (errorCode=="403") window.location.href = "/company/";
        return (
            <div class="center-message" style={{textAlign:"center"}}>
                    {<h3>{this.state.errorMessages[errorCode]}</h3>}
            </div>
        )
    }
}