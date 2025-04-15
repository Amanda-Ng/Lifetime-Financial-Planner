// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

import axios from 'axios';

// const token = localStorage.getItem('token') || null;

export const axiosClient = axios.create({
  baseURL: "http://localhost:8000/auth",
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || null}`,
  },
});

export const axiosClientImport = axios.create({
  baseURL: "http://localhost:8000/auth",
  headers: {
    Accept: 'application/json', 
    Authorization: `Bearer ${localStorage.getItem('token') || null}`,
  },
});

axiosClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    let res = error.response;
    console.error(`Looks like there was a problem. Status Code: ${res.status}`);
    return Promise.reject(error);
  }
);
