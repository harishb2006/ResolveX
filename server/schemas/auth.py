from pydantic import BaseModel, Field


class CustomerOtpRequest(BaseModel):
    mobile: str = Field(pattern=r"^\d{10}$")


class CustomerOtpLogin(BaseModel):
    mobile: str = Field(pattern=r"^\d{10}$")
    otp: str = Field(pattern=r"^\d{6}$")
    challenge_id: str = Field(min_length=36, max_length=36)


class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AuthUser(BaseModel):
    id: int | None
    name: str
    role: str
    mobile: str | None = None


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUser
