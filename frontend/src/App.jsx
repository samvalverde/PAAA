import { useState } from 'react'
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css';
import { Card } from 'primereact/card';
        
        
import './App.css'

function App() {

  return (
    <>
      <Card title= "Login">
        <div className='p-inputgroup flex-1'>
          <span className='p-inputgroup-addon'>
            <i className='pi pi-user'></i>
          </span>
          <InputText placeholder='Username' />
        </div>

        <div className='p-inputgroup space'>
          <span className='p-inputgroup-addon'>
            <i className='pi pi-check'></i>
          </span>
          <InputText placeholder='Password' type='password' />
        </div>
        <div className='card'>
          <Button label='Login' icon='pi pi-check' color='blue'/>
        </div>
      </Card>
    </>
  )
}

export default App
