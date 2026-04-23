const API_URL = 'https://v1.hitokoto.cn/'

const CATEGORY_CODES = ['a', 'b', 'c', 'd', 'e', 'i', 'k', 'l']

export class HitokotoService {
  static async fetchHitokoto(categories = CATEGORY_CODES) {
    try {
      const categoryParams = categories.map(c => `c=${encodeURIComponent(c)}`).join('&')
      const url = `${API_URL}?${categoryParams}&encode=json`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return this._normalizeResponse(data)
    } catch (error) {
      console.error('Failed to fetch hitokoto:', error)
      throw new Error(this._getErrorMessage(error))
    }
  }

  static _normalizeResponse(data) {
    return {
      id: data.id,
      uuid: data.uuid,
      hitokoto: data.hitokoto || '暂无内容',
      type: data.type || '',
      from: data.from || '',
      fromWho: data.from_who || '',
      creator: data.creator || '',
      creatorUid: data.creator_uid,
      reviewer: data.reviewer,
      commitFrom: data.commit_from || '',
      createdAt: data.created_at,
      length: data.length
    }
  }

  static _getErrorMessage(error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return '网络连接失败，请检查网络后重试'
    }
    if (error.message.includes('HTTP error')) {
      return `服务器响应异常: ${error.message}`
    }
    return '获取一言失败，请稍后重试'
  }

  static formatHitokoto(hitokotoData) {
    const { hitokoto, from, fromWho } = hitokotoData

    let fromText = ''
    if (fromWho && from) {
      fromText = `——${fromWho}《${from}》`
    } else if (fromWho) {
      fromText = `——${fromWho}`
    } else if (from) {
      fromText = `——《${from}》`
    } else {
      fromText = '——佚名'
    }

    return {
      content: hitokoto,
      source: fromText,
      fullText: `${hitokoto} ${fromText}`
    }
  }
}

export default HitokotoService
