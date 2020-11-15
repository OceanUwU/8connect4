import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
    palette: {
        type: 'dark',

        background: {
            default: '#050505',
        },

        primary: {
            main: '#d49a3d',
        },
    },

    overrides: {
        MuiButton: {
            textPrimary: {
                background: 'linear-gradient(45deg, #ff7b00 0%, #ff00ff 100%)',
                borderRadius: 3,
                border: 0,
                color: 'white !important',
                padding: '0 30px',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            },

            textSecondary: {
                background: 'linear-gradient(45deg, rgb(255,37,180) 30%, rgb(198,19,19) 90%)',
                borderRadius: 3,
                border: 0,
                color: 'white !important',
                padding: '0 30px',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            }
        },
    },
});

export default theme;