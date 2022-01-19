// eslint-disable-next-line
import React, { useEffect } from 'react';
import axios from 'axios';
import cookies from 'js-cookies';

export default function Token() {

    // eslint-disable-next-line
    useEffect(async () => {
        const data = await getToken();
        document.querySelector("html").innerHTML = JSON.stringify(data);
        // eslint-disable-next-line
    }, [])

    const extractUrlCode = () => {
        let code = "";
        code = window.location.pathname.split('/').slice(0, -1).splice(-1)[0];
        return code;
    }

    const getRoomDetails = async () => {
        let jwt;
        try {
            const authUser = JSON.parse(cookies.getItem("authUser"))
            jwt = authUser.token;
        }
        catch {
            jwt = null;
        }
        const code = extractUrlCode();
        axios.create({ baseURL: process.env.REACT_APP_BACKEND_API, timeout: 2000 });
        const url = process.env.REACT_APP_BACKEND_API + "get-token"

        var headers = {}
        if (jwt) {
            headers = {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
                "subdomain": window.location.hostname
            };
        } else {

            headers = {
                "Content-Type": "application/json",
                "subdomain": window.location.hostname
            };
        }

        let formData = new FormData();
        formData.append('code', code);

        return await axios.post(url, formData, { headers: headers }).then((res) => {
            return res.data;
        })
    }

    const getToken = () => {
        return getRoomDetails().then((res) => {
            return res;
        })
    }

    return null;
}
