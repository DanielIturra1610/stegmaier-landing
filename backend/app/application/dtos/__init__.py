from .course_dto import CourseResponse
from .lesson_dto import LessonResponse

CourseResponse.update_forward_refs(LessonResponse=LessonResponse)
