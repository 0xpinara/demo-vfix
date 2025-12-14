"""
Repository classes for Enterprise and Branch models
Abstracts database operations for enterprise management
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app import models


class EnterpriseRepository:
    """Repository for Enterprise model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> models.Enterprise:
        """Create a new enterprise"""
        enterprise = models.Enterprise(**kwargs)
        self.db.add(enterprise)
        self.db.commit()
        self.db.refresh(enterprise)
        return enterprise
    
    def get_by_id(self, enterprise_id: UUID) -> Optional[models.Enterprise]:
        """Get enterprise by ID"""
        return self.db.query(models.Enterprise).filter(
            models.Enterprise.id == enterprise_id
        ).first()
    
    def get_by_name(self, name: str) -> Optional[models.Enterprise]:
        """Get enterprise by name"""
        return self.db.query(models.Enterprise).filter(
            models.Enterprise.name == name
        ).first()
    
    def get_by_registration_number(self, reg_number: str) -> Optional[models.Enterprise]:
        """Get enterprise by registration number"""
        return self.db.query(models.Enterprise).filter(
            models.Enterprise.registration_number == reg_number
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[models.Enterprise]:
        """Get all enterprises"""
        query = self.db.query(models.Enterprise)
        if active_only:
            query = query.filter(models.Enterprise.is_active == True)
        return query.offset(skip).limit(limit).all()
    
    def update(self, enterprise_id: UUID, **kwargs) -> Optional[models.Enterprise]:
        """Update enterprise"""
        enterprise = self.get_by_id(enterprise_id)
        if enterprise:
            for key, value in kwargs.items():
                setattr(enterprise, key, value)
            self.db.commit()
            self.db.refresh(enterprise)
        return enterprise
    
    def delete(self, enterprise_id: UUID) -> bool:
        """Soft delete enterprise"""
        enterprise = self.get_by_id(enterprise_id)
        if enterprise:
            enterprise.is_active = False
            self.db.commit()
            return True
        return False


class BranchRepository:
    """Repository for Branch model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> models.Branch:
        """Create a new branch"""
        branch = models.Branch(**kwargs)
        self.db.add(branch)
        self.db.commit()
        self.db.refresh(branch)
        return branch
    
    def get_by_id(self, branch_id: UUID) -> Optional[models.Branch]:
        """Get branch by ID"""
        return self.db.query(models.Branch).filter(
            models.Branch.id == branch_id
        ).first()
    
    def get_by_enterprise(self, enterprise_id: UUID, active_only: bool = True) -> List[models.Branch]:
        """Get all branches for an enterprise"""
        query = self.db.query(models.Branch).filter(
            models.Branch.enterprise_id == enterprise_id
        )
        if active_only:
            query = query.filter(models.Branch.is_active == True)
        return query.all()
    
    def get_by_manager(self, manager_id: UUID) -> Optional[models.Branch]:
        """Get branch managed by a user"""
        return self.db.query(models.Branch).filter(
            models.Branch.manager_id == manager_id
        ).first()
    
    def update(self, branch_id: UUID, **kwargs) -> Optional[models.Branch]:
        """Update branch"""
        branch = self.get_by_id(branch_id)
        if branch:
            for key, value in kwargs.items():
                setattr(branch, key, value)
            self.db.commit()
            self.db.refresh(branch)
        return branch
    
    def assign_manager(self, branch_id: UUID, manager_id: UUID) -> Optional[models.Branch]:
        """Assign a manager to a branch"""
        return self.update(branch_id, manager_id=manager_id)
    
    def delete(self, branch_id: UUID) -> bool:
        """Soft delete branch"""
        branch = self.get_by_id(branch_id)
        if branch:
            branch.is_active = False
            self.db.commit()
            return True
        return False
    
    def get_employee_count(self, branch_id: UUID) -> int:
        """Get count of employees in a branch"""
        return self.db.query(models.User).filter(
            models.User.branch_id == branch_id,
            models.User.is_active == True
        ).count()

