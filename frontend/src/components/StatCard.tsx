import { Paper, Box, Typography, Icon } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexGrow: 1,
      }}
    >
      <Box>
        <Typography color="text.secondary">{title}</Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ 
        backgroundColor: color, 
        color: 'white', 
        borderRadius: '50%', 
        width: 56, 
        height: 56, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon sx={{ fontSize: '2rem' }}>{icon}</Icon>
      </Box>
    </Paper>
  );
};

export default StatCard;