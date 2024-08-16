export const FastGPTProUrl = process.env.PRO_URL ? `${process.env.PRO_URL}/api` : '';

export const authTokenUrl = process.env.AUTH_TOKEN_URL ? `${process.env.AUTH_TOKEN_URL}` : '';

export const publicTeamName = process.env.PUBLIK_TEAM_NAME ? `${process.env.PUBLIK_TEAM_NAME}` : '临时团队';

export const publicTeamStart = process.env.PUBLIK_TEAM_START ? `${process.env.PUBLIK_TEAM_START}` : 4;

export const isProduction = process.env.NODE_ENV === 'production';
