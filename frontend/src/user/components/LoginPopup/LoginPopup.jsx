import React, { useContext, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext.js'

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState('Sign Up')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const { loginUser } = useContext(StoreContext)

  const isKiitEmail = useMemo(() => /@kiit\.ac\.in$/i.test(form.email), [form.email])
  const isValidPassword = form.password.length >= 6

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const requestOtp = () => {
    if (!isKiitEmail) {
      setMessage('Use your KIIT mail address ending with @kiit.ac.in')
      return
    }
    if (!isValidPassword) {
      setMessage('Password should be at least 6 characters long')
      return
    }
    const otp = '246810'
    setGeneratedOtp(otp)
    setStep(2)
    setMessage(`Demo OTP sent to ${form.email}. Use ${otp} to continue.`)
  }

  const verifyOtp = () => {
    if (form.otp !== generatedOtp) {
      setMessage('Incorrect OTP. Use the demo OTP shown above.')
      return
    }
    loginUser({ name: form.name || 'KIIT Student', email: form.email })
    setMessage('Logged in successfully.')
    setTimeout(() => setShowLogin(false), 500)
  }

  return (
    <div className='login-popup'>
      <div className='login-popup-container section-card'>
        <div className='login-popup-title'>
          <div>
            <h2>{currState}</h2>
            <p>Frontend authentication UI with KIIT email validation and OTP flow.</p>
          </div>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt='Close' />
        </div>

        <div className='login-popup-inputs'>
          {currState === 'Sign Up' ? <input type='text' name='name' value={form.name} onChange={onChange} placeholder='Your name' /> : null}
          <input type='email' name='email' value={form.email} onChange={onChange} placeholder='yourname@kiit.ac.in' />
          <div className='password-container'>
            <input type={showPassword ? 'text' : 'password'} name='password' value={form.password} onChange={onChange} placeholder='Password (min 6 characters)' />
            <div className='password-toggle' onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>
          {step === 2 ? <input type='text' name='otp' value={form.otp} onChange={onChange} placeholder='Enter OTP' /> : null}
        </div>

        {!isKiitEmail && form.email ? <p className='login-hint error'>Only KIIT email IDs are allowed.</p> : null}
        {message ? <p className={`login-hint ${message.includes('successfully') ? 'success' : ''}`}>{message}</p> : null}

        {step === 1 ? (
          <button onClick={requestOtp}>{currState === 'Login' ? 'Send OTP to login' : 'Create account & send OTP'}</button>
        ) : (
          <button onClick={verifyOtp}>Verify OTP</button>
        )}

        <div className='login-popup-condition'>
          <input type='checkbox' defaultChecked />
          <p>By continuing, you agree to the terms of use & privacy policy.</p>
        </div>
        {currState === 'Login' ? (
          <p>Create a new account? <span onClick={() => { setCurrState('Sign Up'); setStep(1); setMessage('') }}>Click here</span></p>
        ) : (
          <p>Already have an account? <span onClick={() => { setCurrState('Login'); setStep(1); setMessage('') }}>Login here</span></p>
        )}
      </div>
    </div>
  )
}

export default LoginPopup
