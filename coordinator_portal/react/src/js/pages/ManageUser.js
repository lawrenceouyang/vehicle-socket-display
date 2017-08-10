//React
import React from "react"
import { connect } from "react-redux"
import { Link } from "react-router";
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import Avatar from 'material-ui/Avatar';
import CircularProgress from 'material-ui/CircularProgress';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
// Axios
import axios from "axios";
// components
import ErrorMessage from "../components/error"
import SmartAvatar from "../components/smartAvatar"

import {
    blue300,
    indigo900,
    orange200,
    deepOrange300,
    pink400,
    purple500,
    grey400,
} from 'material-ui/styles/colors';


export default class ManageUser extends React.Component {

    constructor(props){
        super(props);
        var snackBarMessage = (this.props.location.state==null ? "": this.props.location.state);
        this.state = {
            users:[],
            userListLoaded: false,
            errorCode: "",
            showSnackBar:this.props.location.state!=null,
            snackBarMessage: snackBarMessage,
            showDeleteDialog: false,
            user_to_delete: null,
        };
    }

    componentDidMount(){
        this.getAllUsers();
    }

    closeSnackBar = () =>{
        this.setState({showSnackBar:false});
    };

    eachUser = (user,index) => {
        const iconButtonElement = (
            <IconButton touch={true}>
                <MoreVertIcon color={grey400} />
            </IconButton>
        );

        const rightIconMenu = (
            <IconMenu iconButtonElement={iconButtonElement} iconStyle={{height:65}}>
                <MenuItem onClick={() => this.context.router.replace({pathname:'/users/edit/'+ user["user_id"]})}>Edit</MenuItem>
                <MenuItem onClick={() =>this.triggerDeleteDialog(user)}>Delete</MenuItem>
            </IconMenu>
        );

        const rightIconMenuDisabled = (
            <IconButton touch={true} style={{height:65, width:65, marginLeft:'-9px'}}>
                <MoreVertIcon color="#eee" />
            </IconButton>
        );


        var user_id= this.props.route["user-id"];
        return(
            <TableRow key={index}>
                    <TableRowColumn>
                        <SmartAvatar text={user["first_name"] + " " + user["last_name"]} table={true}/>
                    </TableRowColumn>
                    <TableRowColumn>{user["first_name"] + " " + user["last_name"]}</TableRowColumn>
                    <TableRowColumn>{user["role"]["role_name"]=="coordinator_admin" ? "Admin" : "User"}</TableRowColumn>
                    <TableRowColumn>{user["email"]}</TableRowColumn>
                    {user.user_id!=user_id && <TableRowColumn>{rightIconMenu}</TableRowColumn>}
                    {user.user_id==user_id && <TableRowColumn>{rightIconMenuDisabled}</TableRowColumn>}
            </TableRow>
        )
    };

    getAllUsers = () => {
        // Run the ajax call
        this.setState({errorCode:"", userListLoaded: false});
        axios.get('/coordinator/coordinators/')
            .then(res => {
                this.setState({users:res.data,errorCode: "",userListLoaded: true});
            })
            .catch(res=>{
                this.setState({errorCode: res.status + ""});
            });
    };

    triggerDeleteDialog = (user) => {
        this.setState({showDeleteDialog: true, user_to_delete: user});
    };
    
    deleteUser = () => {
        var {user_to_delete} = this.state;
        // Run the ajax call
        axios.post('/coordinator/coordinator/'+ user_to_delete.user_id + "/delete/", {})
            .then(res => {
                var message = "User " + user_to_delete["email"] + " Successfully Deleted";
                this.setState({showSnackBar:true, snackBarMessage: message, showDeleteDialog:false, user_to_delete:null});
                this.getAllUsers();
            })
            .catch(res=>{
                var message = "User " + user_to_delete["email"] + " Could Not Be Deleted";
                this.setState({showSnackBar:true, snackBarMessage: message});
                //this.getAllUsers();
            });
    };

    deleteActions = () => {
        return [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={()=> this.setState({showDeleteDialog:false})}
            />,
            <FlatButton
                label="Delete"
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.deleteUser}
            />
        ];
    };

    render() {
        var {users, errorCode, userListLoaded} = this.state;
        return(
            <Card  style={{marginTop:-1, marginRight:-5,  height: 'calc(100vh - 62px)',position: 'relative',border:"none", boxShadow:"none"}}>
                {/* Begin User Table*/}
                {userListLoaded &&
                <div>
                    <Table fixedHeader={true} bodyStyle={{height:'calc(100vh - 120px)'}}>
                        <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
                            <TableRow>
                                <TableHeaderColumn></TableHeaderColumn>
                                <TableHeaderColumn>Name</TableHeaderColumn>
                                <TableHeaderColumn>Role</TableHeaderColumn>
                                <TableHeaderColumn>Email</TableHeaderColumn>
                                <TableHeaderColumn>Action</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody displayRowCheckbox={false}>
                            {users.map(this.eachUser)}
                        </TableBody>
                    </Table>

                    <Dialog
                      title= "Are you sure?"
                      actions={this.deleteActions()}
                      modal={false}
                      open={this.state.showDeleteDialog}
                      onRequestClose={()=> this.setState({showDeleteDialog:false})}
                      contentStyle={{width:400}}>
                        "This will delete the selected user!"
                    </Dialog>

                </div>}

                {/* End User Table*/}

                {/* Begin Error & Progress Bar*/}
                {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
                {!userListLoaded && !errorCode && <div class="loader"><CircularProgress/></div>}
                {/* End Error & Progress Bar*/}

                {/* Begin Add user Floating Button*/}
                <Link to="/users/add">
                    <FloatingActionButton secondary={true} style={{position: 'fixed', right:15, bottom:30}}>
                        <ContentAdd />
                    </FloatingActionButton>
                </Link>
                {/* End Add user Floating Button*/}
                <Snackbar
                    open={this.state.showSnackBar}
                    message={this.state.snackBarMessage}
                    action="Success!"
                    autoHideDuration={5000}
                    onRequestClose={this.closeSnackBar}
                />
            </Card>
        )
    }

}

ManageUser.contextTypes={
    router: React.PropTypes.object.isRequired
};