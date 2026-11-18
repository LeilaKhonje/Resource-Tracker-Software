import {Body, Controller, Get, Header, HttpCode, HttpStatus, Post,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiStandardErrorResponses } from '../common/swagger-response.decorators';

@ApiTags('Authentication')
@ApiStandardErrorResponses(400, 500)
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
          example:'johndoe@gmail.com'
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
  @ApiResponse({ status: 200, description: 'Refresh token revoked.', schema: { type: 'object', properties: { message: { type: 'string', example: 'Logged out successfully' } } } })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or already revoked' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @ApiOperation({ summary: 'Forgot password, send a user the code to reset their password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset request accepted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'A password reset code has been sent to l***a@example.com.',
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

  @ApiBody({type: ResetPasswordDto})
  @ApiOperation({summary: 'Reset pasword, the user enters the code sent to their email and a new password of their choosing'})
  @ApiResponse({ status: 200, description: 'Password reset completed.', schema: { type: 'object', properties: { message: { type: 'string', example: 'Password reset successfully' } } } })
  @ApiResponse({ status: 401, description: 'Password reset code is invalid or expired.' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

 
}
