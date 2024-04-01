import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fire from "../utils/Fire";
import { useAuthState } from "react-firebase-hooks/auth";
import "../assets/scss/login.scss";

const fire = new Fire();
function Login() {
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(fire.getUser());
  const [main, setUser] = useState(user);

  const [log_email, setLogEmail] = useState("");
  const [log_pass, setLogPass] = useState("");
  const [err, setErr] = useState("");
  const login = async () => {
    await fire
      .loginUser_for_targ(log_email, log_pass)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        setErr("Eroare de conectare! Verifica daca ai introdus datele corect!");
        console.log(err);
      });
  };

  useEffect(() => {
    console.log("fire 1: ", fire.getUser1());
    // console.log(user.email);
    const aa = async () => {
      if (user) {
        await fire.getUserByEmail("/targ_users", user.email).then((res) => {
          console.log(res);
          setUser(res);
          navigate(`/profile/${res.email}`);
        });
      }
    };
    aa();
  }, [user]);
  return (
    <>
      <div className="login">
        <h1>OSFIIR</h1>
        <img src={require("../assets/img/logo.png")} alt="" />
        <div className="cerc"></div>
        <div className="form">
          <div className="input_field">
            <h3>Email</h3>
            <input
              type="email"
              placeholder="example@gmail.com"
              onChange={(e) => setLogEmail(e.target.value)}
            />
          </div>
          <div className="input_field">
            <h3>Parola</h3>
            <input
              type="password"
              placeholder="******"
              onChange={(e) => setLogPass(e.target.value)}
            />
          </div>
          {err && <h4>{err}</h4>}
          <button onClick={login}>Login</button>
        </div>
      </div>
    </>
  );
}

export default Login;
