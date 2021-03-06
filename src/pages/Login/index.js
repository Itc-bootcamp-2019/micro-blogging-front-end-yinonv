import React from 'react';
import './style.css';
import firebase from 'firebase'
import { StyledFirebaseAuth, FirebaseAuth } from 'react-firebaseui';
import { usersRef } from '../../lib/api'

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            username: '',
            exists: true,
            isSignedIn: false,
            wrongInput: true,
            loading: false
        }
        this.containerRef = React.createRef();
        this.imgUrl = ''
        this.defaultImage = true;
        this.strength = ''
        this.errorMessage = ''
        this.uiConfig = {
            signInFlow: "popup",
            signInOptions:
                [firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                firebase.auth.FacebookAuthProvider.PROVIDER_ID],
            callbacks: {
                signInSuccess: () => false
            }
        }
    }
    componentDidMount() {  
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                const provider = user.providerData[0].providerId
                if (provider == "google.com" || provider == "facebook.com") {
                    this.handleGoogleFacebookLogin(user);
                }
            }
            this.setState({ isSignedIn: !!user });
        })
    }
    async handleGoogleFacebookLogin(user) {
        const doc = await usersRef.doc(user.uid).get();
        if (doc.data() != undefined) {
            return;
        }
        usersRef.doc(user.uid).set({
            userName: user.providerData[0].displayName,
            img: user.providerData[0].photoURL,
        })
        this.props.updatePhoto();
    }
    async handleLogin() {
        const { email, password } = this.state;
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        }
        catch (e) {
            this.errorMessage = e.message;
            switch (e.message) {
                case "There is no user record corresponding to this identifier. The user may have been deleted.": {
                    this.errorMessage = "User doesn't exist, please register.";
                    this.containerRef.current.classList.add('register-container')
                    this.setState({ exists: false });
                    break;
                }
                case "The password is invalid or the user does not have a password.": {
                    this.errorMessage = "You entered a wrong password.";
                    this.setState({ wrongInput: true });
                    break;
                }
                case "The email address is badly formatted.": {
                    this.errorMessage = "Please enter a valid email.";
                    this.setState({ wrongInput: true });
                    break;
                }
            }
        }
    }
    async handleRegister() {
        if (this.defaultImage) {
            this.imgUrl = 'https://firebasestorage.googleapis.com/v0/b/twitter-3652c.appspot.com/o/default.png?alt=media&token=f7a91030-5f3a-4c97-b9a0-21f3dbe0366f'
        }
        const { email, password, username } = this.state;
        try {
            const data = await firebase.auth().createUserWithEmailAndPassword(email, password);
            usersRef.doc(data.user.uid).set({
                userName: username,
                img: this.imgUrl,
            })
        } catch (e) {
            switch (e.message) {
                case "Password should be at least 6 characters": {
                    this.errorMessage = "Password should be at least 6 characters";
                    this.setState({ wrongInput: true });
                    break;
                }
            }
        }
        this.defaultImage = true;
    }
    render() {
        const { exists, isSignedIn, wrongInput, loading } = this.state;
        return (
            <div ref={this.containerRef} className="login-container">
                <div>
                    {exists && <h1 className="login-title">Sign in</h1>}
                    {!exists && <h1 className="login-title">Sign up</h1>}
                </div>
                <div className="input-container">
                    {!exists && <label>Enter email</label>}
                    <input onChange={(e) => this.setState({ email: e.target.value })} className="input" type="email" placeholder="email"></input>
                    {!exists && <label>Enter username</label>}
                    {!exists && <input onChange={(e) => this.setState({ username: e.target.value })} className="input" placeholder="username"></input>}
                    {!exists && <label>Enter password</label>}
                    <input onChange={(e) => this.setState({ password: e.target.value })} className="input" type="password" placeholder="password"></input>
                </div>
                {wrongInput && <div>
                    <p className="error-message">{this.errorMessage}</p>
                </div>}
                {exists && <div>
                    <button onClick={() => this.handleLogin()} className="login-button">Login</button>
                </div>}
                {!exists && <div>
                    <button disabled={loading} onClick={() => this.handleRegister()} className="login-button">Register</button>
                </div>}
                {!isSignedIn && <StyledFirebaseAuth uiConfig={this.uiConfig} firebaseAuth={firebase.auth()} />}
                {isSignedIn && <div>
                    <button onClick={() => firebase.auth().signOut()}>Sign out</button>
                </div>}
            </div>
        )
    }
}

export default Login;