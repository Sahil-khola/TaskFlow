import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [err,setErr]=useState('')
  const [busy,setBusy]=useState(false)
  const {login}=useContext(AuthContext)
  const navigate=useNavigate()

  const submit=async(e)=>{
    e.preventDefault()
    setErr('')
    setBusy(true)
    try{
      await login(email,password)          // token save + /me internally
      navigate('/')
    }catch(er){
      // backend "msg" bhejta hai, "message" nahi
      setErr(er.response?.data?.msg || 'Login failed')
    }finally{
      setBusy(false)
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow w-96">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded mb-3"/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 rounded mb-4"/>
      <button disabled={busy} className="w-full bg-black text-white py-2 rounded disabled:opacity-60">
        {busy ? 'Logging in...' : 'Login'}
      </button>
      <p className="text-sm mt-4 text-center"><Link to="/signup" className="underline">Create account</Link></p>
    </form>
  </div>
}