import React from 'react';
import './App.css';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';



export default class Autorization extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      login: 'andrey',
      pass: '12345',
      login1: '',
      pass1: ''
    };
  }

  CheckLogin = () => {
    if (this.state.pass === this.state.pass1 && this.state.login === this.state.login1) {
    this.props.history.push("/todolist")
    }
  }

  render() {
    return (
      <div className="wrapper_Login">
      <div className="Login_name">Log In</div>
      <div className="form">
        <div className="login">
        <TextField
        id="outlined-name"
        label="Name"
        margin="normal"
        variant="outlined"
        onChange={el => this.setState({ login1: el.target.value })}
      />
        </div>
        <div className="pass">
        <TextField
        type="password"
        id="outlined-name"
        label="Password"
        margin="normal"
        variant="outlined"
        onChange={el => this.setState({ pass1: el.target.value })}
      />
        </div>
      </div>
      <div className="Login_button" >
        <Button onClick={this.CheckLogin} variant="contained" color="primary">LOGIN</Button>
      </div>
      </div>
    );
  }
}