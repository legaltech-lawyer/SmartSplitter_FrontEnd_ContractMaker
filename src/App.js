import './App.css';
import SmartSplitterFactory from './components/SmartSplitterFactory';
import { createTheme, ThemeProvider, Container } from "@mui/material"

let theme = createTheme({
  palette: {
    primary: {
      main: '#52cc00',
    },
    secondary: {
      main: '#85cc00',
    },
  },
  typography: {
    fontFamily: "Lato"
  }
});

function App() {

  return (
    <ThemeProvider theme={theme}>
      <Container className="App">
        <SmartSplitterFactory />
      </Container>
    </ThemeProvider>

  );
}

export default App;
