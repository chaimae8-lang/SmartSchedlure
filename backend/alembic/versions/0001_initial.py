"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("academic_years", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("label", sa.String(20), nullable=False, unique=True), sa.Column("is_active", sa.Boolean(), nullable=False))
    op.create_table("subjects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("code", sa.String(20), nullable=False, unique=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("requires_lab", sa.Boolean(), nullable=False), sa.Column("requires_gym", sa.Boolean(), nullable=False), sa.Column("coefficient", sa.Integer(), nullable=False))
    op.create_table("rooms", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(50), nullable=False, unique=True), sa.Column("capacity", sa.Integer(), nullable=False), sa.Column("room_type", sa.Enum("normal", "lab", "computer", "drawing", "gym", name="roomtype"), nullable=False), sa.Column("max_daily_uses", sa.Integer(), nullable=False))
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("username", sa.String(80), nullable=False, unique=True), sa.Column("hashed_password", sa.String(255), nullable=False), sa.Column("role", sa.String(50), nullable=False))
    op.create_table("filieres", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("code", sa.String(20), nullable=False, unique=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("niveau", sa.Enum("tronc_commun", "premiere_bac", "deuxieme_bac", name="niveau"), nullable=False))
    op.create_table("teachers", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("first_name", sa.String(80), nullable=False), sa.Column("last_name", sa.String(80), nullable=False), sa.Column("teacher_type", sa.Enum("titulaire", "vacataire", name="teachertype"), nullable=False), sa.Column("max_hours_week", sa.Integer(), nullable=False), sa.Column("max_hours_day", sa.Integer(), nullable=False))
    op.create_table("classes", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(), nullable=False, unique=True), sa.Column("filiere_id", sa.Integer(), sa.ForeignKey("filieres.id", ondelete="CASCADE"), nullable=False), sa.Column("student_count", sa.Integer(), nullable=False))
    op.create_table("class_subjects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("filiere_id", sa.Integer(), sa.ForeignKey("filieres.id", ondelete="CASCADE"), nullable=False), sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False), sa.Column("hours_per_week", sa.Integer(), nullable=False), sa.UniqueConstraint("filiere_id", "subject_id", name="uq_filiere_subject"))
    op.create_table("teacher_subjects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False), sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False), sa.UniqueConstraint("teacher_id", "subject_id", name="uq_teacher_subject"))
    op.create_table("teacher_unavailability", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False), sa.Column("day", sa.Enum("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", name="dayofweek"), nullable=False), sa.Column("period_start", sa.Integer(), nullable=False), sa.Column("period_end", sa.Integer(), nullable=False), sa.Column("reason", sa.String(200), nullable=True))
    op.create_table("schedule_slots", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("academic_year_id", sa.Integer(), sa.ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False), sa.Column("class_id", sa.Integer(), sa.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False), sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False), sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False), sa.Column("room_id", sa.Integer(), sa.ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False), sa.Column("day", sa.Enum("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", name="dayofweek"), nullable=False), sa.Column("period", sa.Integer(), nullable=False), sa.Column("is_locked", sa.Boolean(), nullable=False), sa.UniqueConstraint("academic_year_id", "class_id", "day", "period", name="uq_schedule_class_slot"), sa.UniqueConstraint("academic_year_id", "teacher_id", "day", "period", name="uq_schedule_teacher_slot"), sa.UniqueConstraint("academic_year_id", "room_id", "day", "period", name="uq_schedule_room_slot"))


def downgrade():
    for table in ["schedule_slots", "teacher_unavailability", "teacher_subjects", "class_subjects", "classes", "teachers", "filieres", "users", "rooms", "subjects", "academic_years"]:
        op.drop_table(table)
