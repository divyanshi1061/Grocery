'use client'
import RegisterForm from '@/src/components/RegisterForm'
import Welcome from '@/src/components/Welcome'
import { useState } from 'react'

function Register() {
  const [step,setStep]= useState(1)
  return (
    <div>
      {step==1 ? <Welcome nextStep={setStep}/> : <RegisterForm previousStep={setStep}/>} 
      
    </div>
  )
}

export default Register