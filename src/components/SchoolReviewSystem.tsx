import { useState } from 'react'
import { Star, MessageSquare, ThumbsUp, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Review {
  id: string
  studentName: string
  rating: number
  comment: string
  experience: string
  courseTaken?: string
  dateAttended: string
  helpful: number
  date: string
}

interface SchoolReviewSystemProps {
  schoolId: number
  schoolName: string
}

export function SchoolReviewSystem({ schoolId, schoolName }: SchoolReviewSystemProps) {
  const { user } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [experience, setExperience] = useState('')
  const [courseTaken, setCourseTaken] = useState('')
  const [dateAttended, setDateAttended] = useState('')

  // Beispiel-Reviews (später aus API laden)
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      studentName: 'Maria S.',
      rating: 5,
      comment: 'Excellent school with very professional teachers.',
      experience: 'I studied B2 level here for 3 months. The small class sizes really helped me improve quickly. The teachers are native speakers and very patient.',
      courseTaken: 'Intensiv B2 Kurs',
      dateAttended: '2024-01-15',
      helpful: 12,
      date: '2024-04-20'
    },
    {
      id: '2',
      studentName: 'Ahmed B.',
      rating: 4,
      comment: 'Good quality teaching, central location.',
      experience: 'Studied A2 to B1 here. Good progress in speaking skills. Would recommend for beginners.',
      courseTaken: 'Abendkurs A2-B1',
      dateAttended: '2023-09-10',
      helpful: 8,
      date: '2024-03-15'
    }
  ])

  const handleSubmitReview = () => {
    if (!user || rating === 0) return

    const newReview: Review = {
      id: Date.now().toString(),
      studentName: `${user.firstName} ${user.familyName?.charAt(0)}.` || 'Student',
      rating,
      comment,
      experience,
      courseTaken,
      dateAttended,
      helpful: 0,
      date: new Date().toISOString().split('T')[0]
    }

    setReviews([newReview, ...reviews])
    
    // Reset form
    setRating(0)
    setComment('')
    setExperience('')
    setCourseTaken('')
    setDateAttended('')
    setShowReviewForm(false)

    // Hier würde normalerweise eine API-Anfrage erfolgen
    console.log('Review submitted:', newReview)
  }

  const renderStars = (count: number, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < count 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
      />
    ))
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center space-x-2 text-gray-600">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Bewertungen und Erfahrungen</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Melden Sie sich als Student an, um Bewertungen zu schreiben und Erfahrungsberichte zu lesen.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          Jetzt anmelden
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Form */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Ihre Erfahrung mit {schoolName}
          </h3>
          {!showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              Bewertung schreiben
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bewertung *
              </label>
              <div className="flex space-x-1">
                {renderStars(hoveredRating || rating, true)}
              </div>
            </div>

            {/* Course taken */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welchen Kurs haben Sie besucht?
              </label>
              <input
                type="text"
                value={courseTaken}
                onChange={(e) => setCourseTaken(e.target.value)}
                placeholder="z.B. Intensiv B2 Kurs, Abendkurs A1..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date attended */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wann haben Sie den Kurs besucht?
              </label>
              <input
                type="date"
                value={dateAttended}
                onChange={(e) => setDateAttended(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Short comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurze Bewertung *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Zusammenfassung Ihrer Erfahrung in einem Satz..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Detailed experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ihre detaillierte Geschichte und Erfahrung
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Erzählen Sie Ihre Geschichte: Wie war der Unterricht? Haben Sie Ihre Ziele erreicht? Was hat Ihnen besonders gefallen oder nicht gefallen?"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || !comment.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Bewertung veröffentlichen
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Erfahrungsberichte ({reviews.length})
        </h3>
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {review.studentName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{review.studentName}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-gray-900 font-medium">{review.comment}</p>
            </div>

            {review.courseTaken && (
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {review.courseTaken} • {review.dateAttended}
                </span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.experience}
              </p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span>Hilfreich ({review.helpful})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
