from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user signup/login"""
    email: EmailStr
    password: str

    class Config:
        example = {
            "email": "user@example.com",
            "password": "securepassword123"
        }


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    role: str = "user"

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str

    class Config:
        example = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer"
        }


class TokenData(BaseModel):
    """Schema for token payload data"""
    user_id: int = None
    role: str = None
