import { Box, Typography } from '@mui/material';
import { CropOriginalRounded } from '@mui/icons-material';

interface ImagePlaceholderProps {
  height?: number;
}

export default function ImagePlaceholder({ height = 300 }: ImagePlaceholderProps) {
  return (
     <Box
            sx={{
                height: height,
                bgcolor: 'grey.100',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'grey.400',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <CropOriginalRounded 
                sx={{ 
                    fontSize: '4rem',
                    mb: 2,
                    color: 'grey.300'
                }}
            />
            <Typography 
                variant="h6" 
                sx={{ 
                    fontWeight: 500,
                    color: 'grey.500',
                    textAlign: 'center',
                    px: 2
                }}
            >
            </Typography>
            <Typography 
                variant="body2" 
                sx={{ 
                    color: 'grey.400',
                    textAlign: 'center',
                    mt: 0.5
                }}
            >
            </Typography>
        </Box>
  );
}
