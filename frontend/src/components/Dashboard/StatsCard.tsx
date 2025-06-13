import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
  alpha,
  Fade,
  Grow,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  isLoading?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  isLoading = false,
  subtitle,
  onClick,
}) => {
  const theme = useTheme();
  
  const colorValue = theme.palette[color].main;
  const backgroundGradient = `linear-gradient(135deg, ${alpha(colorValue, 0.1)} 0%, ${alpha(colorValue, 0.05)} 100%)`;

  if (isLoading) {
    return (
      <Card
        sx={{
          height: '100%',
          background: backgroundGradient,
          border: `1px solid ${alpha(colorValue, 0.2)}`,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Grow in timeout={600}>
      <Card
        sx={{
          height: '100%',
          background: backgroundGradient,
          border: `1px solid ${alpha(colorValue, 0.2)}`,
          transition: 'all 0.3s ease-in-out',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: onClick ? 'translateY(-4px)' : 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(colorValue, 0.3)}`,
            borderColor: alpha(colorValue, 0.4),
          },
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={onClick}
      >
        {/* Animated background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(colorValue, 0.1)} 0%, transparent 70%)`,
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 0.7,
              },
              '50%': {
                transform: 'scale(1.1)',
                opacity: 0.3,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 0.7,
              },
            },
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="body2"
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: alpha(colorValue, 0.15),
                color: colorValue,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: alpha(colorValue, 0.25),
                  transform: 'scale(1.1)',
                },
              }}
            >
              {icon}
            </Box>
          </Box>

          {/* Main Value */}
          <Fade in timeout={800}>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                background: `linear-gradient(45deg, ${colorValue}, ${alpha(colorValue, 0.7)})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                '@keyframes gradient': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            >
              {value}
            </Typography>
          </Fade>

          {/* Trend and Subtitle */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {trend && (
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  color: trend.direction === 'up' ? 'success.main' : 'error.main',
                  backgroundColor: alpha(
                    trend.direction === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    0.1
                  ),
                  borderRadius: '16px',
                  px: 1,
                  py: 0.5,
                  transition: 'all 0.3s ease',
                }}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="caption" fontWeight={600}>
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
            
            {subtitle && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ 
                  fontStyle: 'italic',
                  ml: 'auto',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

export default StatsCard; 