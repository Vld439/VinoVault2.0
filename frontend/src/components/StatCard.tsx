import { Paper, Box, Typography, Icon, useTheme, useMediaQuery } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 2, sm: 2.5 }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexGrow: 1,
        height: '100%',
        minHeight: { xs: 100, sm: 120 }
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          color="text.secondary"
          variant={isMobile ? "body2" : "body1"}
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            mb: 0.5
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="p" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}
        >
          {value}
        </Typography>
      </Box>
      <Box sx={{ 
        backgroundColor: color, 
        color: 'white', 
        borderRadius: '50%', 
        width: { xs: 48, sm: 56 }, 
        height: { xs: 48, sm: 56 }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        ml: 1
      }}>
        <Icon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>{icon}</Icon>
      </Box>
    </Paper>
  );
};

export default StatCard;