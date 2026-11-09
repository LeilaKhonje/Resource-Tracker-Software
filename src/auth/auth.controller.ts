import {Body, Controller, HttpCode, HttpStatus, Post,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully', schema: { type: 'object', properties: { accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }, refreshToken: { type: 'string' } }, required: ['accessToken', 'refreshToken'] } })
  @ApiResponse({ status: 400, description: 'Invalid email or password field format' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['email', 'password'],
       properties:{
        email:{
          type: 'string',
          example:'johndoe@company.com'
        },
        password:{
          type: 'string',
          example:'password123'
        },
       },
    },
  })
  @Post('')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Obtain new tokens using a refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens issued',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
      required: ['accessToken', 'refreshToken'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is invalid, expired, or user is inactive',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Log out and revoke the current refresh token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Refresh token revoked' })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or already revoked' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @ApiOperation({ summary: 'Forgot password, send a user the link to reset their password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset request accepted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If an account exists for this email, password reset instructions will be sent.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}
