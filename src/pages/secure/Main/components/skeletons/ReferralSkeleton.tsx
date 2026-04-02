import { Box, Skeleton } from '@mui/material';

export default function ReferralSkeleton() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1, mr: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="35%" height={14} />
        </Box>
        <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 4 }} />
      </Box>

      {/* Stepper skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 0.5 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="70%" height={12} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
