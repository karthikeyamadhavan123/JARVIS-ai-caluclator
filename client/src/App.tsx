
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TabEditor from './editor/TabEditor'
//contains the main logic of the components
function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<TabEditor />} />
        </Routes>
    </BrowserRouter>

  )
}

export default App
