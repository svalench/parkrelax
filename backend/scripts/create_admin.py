import asyncio
import argparse
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Admin
from app.routers.admin_auth import hash_password


async def main():
    parser = argparse.ArgumentParser(description="Create admin user")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", default="")
    args = parser.parse_args()

    if len(args.password) < 6:
        print("Password must be at least 6 characters")
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Admin).where(Admin.username == args.username))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Admin with username '{args.username}' already exists")
            sys.exit(1)

        admin = Admin(
            username=args.username,
            passwordHash=hash_password(args.password),
            name=args.name or None,
        )
        db.add(admin)
        await db.commit()
        print(f"Admin '{args.username}' created successfully")


if __name__ == "__main__":
    asyncio.run(main())
