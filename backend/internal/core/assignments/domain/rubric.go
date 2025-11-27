package domain

import (
	"time"

	"github.com/google/uuid"
)

// RubricLevel representa un nivel de desempeño en un criterio de rúbrica
type RubricLevel struct {
	Name        string  `json:"name"`
	Points      float64 `json:"points"`
	Description string  `json:"description"`
}

// NewRubricLevel crea un nuevo nivel de rúbrica
func NewRubricLevel(name string, points float64, description string) *RubricLevel {
	return &RubricLevel{
		Name:        name,
		Points:      points,
		Description: description,
	}
}

// Validate valida los datos del nivel
func (l *RubricLevel) Validate() error {
	if l.Name == "" {
		return ErrInvalidRubricLevel
	}
	if l.Points < 0 {
		return ErrInvalidPoints
	}
	if l.Description == "" {
		return ErrInvalidRubricLevel
	}
	return nil
}

// RubricCriterion representa un criterio de evaluación en una rúbrica
type RubricCriterion struct {
	ID          uuid.UUID      `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	MaxPoints   float64        `json:"max_points"`
	Weight      float64        `json:"weight"`        // Peso del criterio (0.0 - 1.0)
	Levels      []RubricLevel  `json:"levels"`        // Niveles de desempeño
	Order       int            `json:"order"`         // Orden de visualización
}

// NewRubricCriterion crea un nuevo criterio de rúbrica
func NewRubricCriterion(name, description string, maxPoints, weight float64, levels []RubricLevel) *RubricCriterion {
	return &RubricCriterion{
		ID:          uuid.New(),
		Name:        name,
		Description: description,
		MaxPoints:   maxPoints,
		Weight:      weight,
		Levels:      levels,
	}
}

// Validate valida los datos del criterio
func (c *RubricCriterion) Validate() error {
	if c.Name == "" {
		return ErrInvalidRubricCriterion
	}
	if c.MaxPoints <= 0 {
		return ErrInvalidPoints
	}
	if c.Weight < 0 || c.Weight > 1 {
		return ErrInvalidWeight
	}
	if len(c.Levels) == 0 {
		return ErrInvalidRubricLevels
	}

	// Validar cada nivel
	for _, level := range c.Levels {
		if err := level.Validate(); err != nil {
			return err
		}
		if level.Points > c.MaxPoints {
			return ErrInvalidPoints
		}
	}

	return nil
}

// AddLevel agrega un nivel al criterio
func (c *RubricCriterion) AddLevel(level RubricLevel) error {
	if err := level.Validate(); err != nil {
		return err
	}
	if level.Points > c.MaxPoints {
		return ErrInvalidPoints
	}
	c.Levels = append(c.Levels, level)
	return nil
}

// Rubric representa una rúbrica de evaluación completa
type Rubric struct {
	ID          uuid.UUID         `json:"id"`
	TenantID    uuid.UUID         `json:"tenant_id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Criteria    []RubricCriterion `json:"criteria"`
	TotalPoints float64           `json:"total_points"`
	IsTemplate  bool              `json:"is_template"`
	CreatedBy   uuid.UUID         `json:"created_by"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// NewRubric crea una nueva rúbrica
func NewRubric(tenantID, createdBy uuid.UUID, name, description string, criteria []RubricCriterion, isTemplate bool) *Rubric {
	rubric := &Rubric{
		ID:          uuid.New(),
		TenantID:    tenantID,
		Name:        name,
		Description: description,
		Criteria:    criteria,
		IsTemplate:  isTemplate,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	// Calcular puntos totales
	rubric.CalculateTotalPoints()

	return rubric
}

// Validate valida los datos de la rúbrica
func (r *Rubric) Validate() error {
	if r.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if r.Name == "" {
		return ErrInvalidRubricName
	}
	if r.CreatedBy == uuid.Nil {
		return ErrInvalidUserID
	}
	if len(r.Criteria) == 0 {
		return ErrInvalidRubricCriteria
	}

	// Validar cada criterio
	totalWeight := 0.0
	for i, criterion := range r.Criteria {
		if err := criterion.Validate(); err != nil {
			return err
		}
		totalWeight += criterion.Weight
		r.Criteria[i].Order = i + 1
	}

	// Validar que los pesos sumen 1.0 (con tolerancia para errores de punto flotante)
	if totalWeight < 0.99 || totalWeight > 1.01 {
		return ErrInvalidTotalWeight
	}

	return nil
}

// CalculateTotalPoints calcula el total de puntos de la rúbrica
func (r *Rubric) CalculateTotalPoints() {
	total := 0.0
	for _, criterion := range r.Criteria {
		total += criterion.MaxPoints * criterion.Weight
	}
	r.TotalPoints = total
}

// AddCriterion agrega un criterio a la rúbrica
func (r *Rubric) AddCriterion(criterion RubricCriterion) error {
	if err := criterion.Validate(); err != nil {
		return err
	}
	r.Criteria = append(r.Criteria, criterion)
	r.CalculateTotalPoints()
	r.UpdatedAt = time.Now().UTC()
	return nil
}

// RemoveCriterion elimina un criterio de la rúbrica
func (r *Rubric) RemoveCriterion(criterionID uuid.UUID) error {
	for i, criterion := range r.Criteria {
		if criterion.ID == criterionID {
			r.Criteria = append(r.Criteria[:i], r.Criteria[i+1:]...)
			r.CalculateTotalPoints()
			r.UpdatedAt = time.Now().UTC()
			return nil
		}
	}
	return ErrRubricCriterionNotFound
}

// Update actualiza los datos de la rúbrica
func (r *Rubric) Update(name, description string, criteria []RubricCriterion) error {
	if name != "" {
		r.Name = name
	}
	if description != "" {
		r.Description = description
	}
	if len(criteria) > 0 {
		r.Criteria = criteria
		r.CalculateTotalPoints()
	}
	r.UpdatedAt = time.Now().UTC()
	return r.Validate()
}
