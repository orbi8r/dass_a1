/*4.3*/
import React, {createContext, useState, useEffect} from'react';
import api from './api';

var AuthCtx= createContext();

function AuthProvider({children}){
  var [user,setUser] = useState(null);
 var [loading, setLoading]= useState(true);

  useEffect(function(){
    var t= localStorage.getItem('token');
    if(t){
      api.get('/auth/me').then(function(r){
       setUser(r.data);
       setLoading(false);
    }).catch(function(){
        localStorage.removeItem('token');
        setLoading(false);
     });
    } else {
      setLoading(false);
     }
  },[]);

  var login= async function(email,password){
    var r= await api.post('/auth/login',{email,password});
   localStorage.setItem('token',r.data.token);
     setUser(r.data.user);
    return r.data.user;
  };

  var logout= function(){
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthCtx.Provider value={{user,setUser,login,logout,loading}}>
     {!loading && children}
  </AuthCtx.Provider>;
}

export {AuthCtx,AuthProvider};
