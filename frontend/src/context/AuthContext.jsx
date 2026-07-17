import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek mock session saat pertama dimuat
  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginMock = async () => {
    try {
      // Panggil backend mock route agar kita dapat JWT Cookie beneran
      const response = await axios.post('http://localhost:5000/api/v1/auth/mock', {}, {
        withCredentials: true
      });
      
      const loggedInUser = response.data.user;
      setUser(loggedInUser);
      localStorage.setItem('mock_user', JSON.stringify(loggedInUser));
    } catch (error) {
      console.error("Gagal melakukan mock login ke backend", error);
      alert("Gagal melakukan login. Pastikan backend berjalan.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_user');
    // Jika perlu, tambahkan call ke /api/v1/auth/logout untuk clear cookie
    axios.post('http://localhost:5000/api/v1/auth/logout', {}, { withCredentials: true }).catch(()=>console.log('logout error'));
  };

  return (
    <AuthContext.Provider value={{ user, loginMock, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
