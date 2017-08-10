//React
import React from "react"
import { connect } from "react-redux"
import { Link } from "react-router";
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
// Flex box grid
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import Avatar from 'material-ui/Avatar';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import ErrorMessage from "../components/error"
// axios
import axios from "axios";



import {
    blue300,
    indigo900,
    orange200,
    deepOrange300,
    pink400,
    purple500,
    grey400
} from 'material-ui/styles/colors';


export default class EditUser extends React.Component {

    /*************************************************************************************
     * Constructor to set the initial state of the checkin summary component
     * @param props
     *************************************************************************************/
    constructor(props){
        super(props);
        this.state = {
            user_id: this.props.params.user_id,
            userLoaded: false,
            errorCode: "",
            userData:  {first_name: "", last_name: "", email: "", admin: false},
            errorText: {first_name: "", last_name: "", email: ""},
            dataIsValid: {first_name: true, last_name: true, email: true}
        };
        console.log(this.props);
    }

    // When the component is finished mounting the user info is retrieved from the server
    componentDidMount(){
        this.getUser();
    }

    // Grab the user info from the server
    getUser = () => {
        var {userData, errorCode, dataLoaded, user_id} = this.state;
        // Run the ajax call
        axios.get('/coordinator/coordinator/'+ user_id + '/')
            .then(res => {
                userData.first_name = res.data.first_name;
                userData.last_name = res.data.last_name;
                userData.email = res.data.email;
                userData.admin = res.data.role.role_name=="coordinator_admin";
                errorCode = "";
                dataLoaded = true;
                this.setState({userData,errorCode,dataLoaded});
            })
            .catch(res=>{
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

    // Returns true if an email address is valid
    isValidEmail(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
    };

    // Returns true if all the input fields are complete and valid
    allIsValid = () => {
        var {dataIsValid}=this.state;
        return dataIsValid.first_name && dataIsValid.last_name && dataIsValid.email;
    };


     /*************************************************************************************
     * Handlers to change the state of the input variables upon user interaction
     *************************************************************************************/


    handleFirstNameChange = (object, newString) =>{
        var {errorText,userData,dataIsValid} = this.state;
        if (newString==""){
            this.state.errorText.first_name="Please Enter a Valid First Name";
            this.state.dataIsValid.first_name = false;
        }
        else{
            this.state.errorText.first_name="";
            this.state.dataIsValid.first_name=true;
        }
        this.state.userData["first_name"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleLastNameChange = (object, newString) =>{
        var {errorText,userData, dataIsValid} = this.state;
        if (newString==""){
            this.state.errorText.last_name="Please Enter a Valid Last Name";
            this.state.dataIsValid.last_name=false;
        }
        else{
            this.state.errorText.last_name="";
            this.state.dataIsValid.last_name=true;
        }
        this.state.userData["last_name"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleEmailChange = (object, newString) =>{
        var {errorText,userData, dataIsValid} = this.state;
        if (!this.isValidEmail(newString)){
            this.state.dataIsValid.email=false;
            this.state.errorText.email="Please Enter a Email Address";
        }
        else{
            this.state.errorText.email="";
            this.state.dataIsValid.email=true;
        }
        this.state.userData["email"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleAdminChange = (object, checked) =>{
        var {userData} = this.state;
        this.state.userData["admin"]=checked;
        this.setState({userData});

    };

     /*************************************************************************************
     * Update existing user by calling the create post in the server
     *************************************************************************************/

    updateExistingUser = () => {
        var {userData,user_id} = this.state;
        // Run the ajax call
        axios.post('/coordinator/coordinator/'+ user_id + "/edit/", userData)
            .then(res => {
                var message = "User " + userData["email"] + " Successfully Updated.";
                this.context.router.replace({pathname:'/users',state: message});
            })
            .catch(res=>{
                this.setState({errorCode: res.status + ""});
                var message = "User " + userData["email"] + " Could Not Be Updated";
                if(res.status==409){
                    message = "User " + userData["email"] + " Already Exists!";
                }
                this.context.router.replace({pathname:'/users',state: message});
            });
    };

    /*********************************************************************************************************
      * The best part of all, render function
      * Form with 4 components, firstname, lastname, email and isAdmin checkbox. Also the Add user Button!
      * DataLoader and progress bar as edit requires data to be loaded from the server
     **********************************************************************************************************/
    render() {
        var {errorText, dataLoaded,errorCode, userData} = this.state;
        return(
             <Card  style={{marginTop:-1, boxShadow: "none",  height: 'calc(100vh - 62px)'}}>

                 {/** Only show the form after the data has completed loading **/}
                 {dataLoaded &&
                 <Row>
                    <Col xs={12} sm={6} md={6} lg={6} smOffset={3} mdOffset={3} lgOffset={3}>
                        <br/>
                        <Row>
                            <Col xs={6} sm={6} md={6} lg={6}>
                                <TextField hintText="First Name *" value={userData.first_name} errorText={errorText.first_name} fullWidth={true} onChange={this.handleFirstNameChange}/>
                            </Col>
                         <Col xs={6} sm={6} md={6} lg={6}>
                                <TextField hintText="Last Name *" value={userData.last_name} errorText={errorText.last_name} fullWidth={true} onChange={this.handleLastNameChange}/>
                         </Col>
                        </Row>
                        <br/>
                        <TextField hintText="Email *"  value={userData.email} errorText={errorText.email} fullWidth={true} onChange={this.handleEmailChange}/>
                        <br/><br/>
                        <Checkbox label="Create as Administrator?" checked={userData.admin} onCheck={this.handleAdminChange}/>
                        <br/>
                        <RaisedButton label="Update user" primary={true} onClick={this.updateExistingUser} disabled={!this.allIsValid()}/>
                    </Col>
                </Row>}

                 {/** Show loading if the data has not loaded and there is no error  **/}
                 {!dataLoaded && errorCode=="" &&
                    <div class="loader"><CircularProgress/></div>
                 }
                 {/** Show error if the data has loaded but there is error **/}
                {errorCode!="" &&  <ErrorMessage errorCode={errorCode}/>}

            </Card>
        )
    }

}

// Required for routing to a different page from the current page
EditUser.contextTypes={
    router: React.PropTypes.object.isRequired
};