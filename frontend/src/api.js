/*4.2*/
import axios from 'axios';

var api= axios.create({baseURL: process.env.REACT_APP_API_URL|| 'http://localhost:5000/api'});

api.interceptors.request.use(function(cfg){
 var t= localStorage.getItem('token');
   if(t) cfg.headers.Authorization= 'Bearer '+t;
  return cfg;
});

api.interceptors.response.use(function(res){ return res; }, function(err){
  if(err.response && err.response.status===401){
  localStorage.removeItem('token');
   if(window.location.pathname!=='/login') window.location = '/login';
  }
  return Promise.reject(err);
});

export default api;
