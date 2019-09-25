import React from 'react';
import './App.css';
import ToDoList from './todoList'
import Autorization from './Autorization';
import { BrowserRouter, Route, Redirect, Switch } from "react-router-dom";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <BrowserRouter >
        <div className="App">
          <Switch>
            <Route path="/login" component={Autorization} />
            <Route path="/todolist" component={ToDoList} />
            <Redirect to='/login' />
          </Switch>
        </div>
      </BrowserRouter>
    );
  }
}